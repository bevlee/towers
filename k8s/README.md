# Kubernetes Manifests

Deploys Two Towers to a Kubernetes cluster behind Traefik with a wildcard TLS cert.

A parallel dev environment (namespace `towers-dev`, `towers-dev.bevsoft.com`, `:dev`
image tags, its own PocketBase) lives in `../k8s-dev/` — see its README. If you change
manifests here, mirror the change there.

## Files

| File | Purpose |
|------|---------|
| `namespace.yaml` | Creates the `towers` namespace |
| `deployment.yaml` | Single pod with two containers: `client` (nginx, port 80) and `server` (Node.js, port 3000) |
| `service.yaml` | ClusterIP services: `nginx` (port 80) and `gameserver` (port 3000) |
| `ingress.yaml` | Traefik ingress for `towers.bevsoft.com` with TLS; routes `/socket.io/` to `gameserver`, everything else to `nginx` |
| `certificate.yaml` | cert-manager Certificate for `*.bevsoft.com` (creates `bevsoft-wildcard-tls`) |
| `kustomization.yaml` | Entry point for `kubectl apply -k k8s` and Skaffold; pins the release image tag |
| `pocketbase/` | PocketBase StatefulSet, service, ingress, and the schema setup Job + script |

Both containers run in the same pod, so the server is reachable at `127.0.0.1:3000` from the nginx container (see `GAMESERVER_HOST` / `GAMESERVER_PORT` env vars).

## Deploy with Skaffold

`skaffold.yaml` (repo root) builds both images for `linux/amd64` and `linux/arm64`
(OKE runs ARM64 hosts), tags them with the release version, pushes them to Docker Hub,
and deploys `k8s/` through its Kustomize entry point, `k8s/kustomization.yaml`.

Prerequisites: `skaffold` v2, `kubectl` pointing at the cluster, `docker login` to
Docker Hub, Docker with buildx, cert-manager and Traefik in the cluster.

```bash
skaffold run
kubectl -n towers rollout status deployment/towers --timeout=5m
```

Every deploy also re-runs the PocketBase schema setup: a Skaffold `before` hook deletes
the `pocketbase-setup` Job so the re-applied one runs again (the script is idempotent).

### Cutting a new version

Release tags are immutable (`imagePullPolicy: IfNotPresent`), so bump the version for
every release, in both places:

1. `skaffold.yaml` → `build.tagPolicy.envTemplate.template`
2. `k8s/kustomization.yaml` → `images[].newTag` (both images)

Commit, tag the commit (`git tag vX.Y && git push origin vX.Y`), then `skaffold run`.
Rolling back is `kubectl apply -k k8s` from the previous tag's checkout.

### First install

The PocketBase admin secret is not part of the Kustomization (its values are
placeholders). Create it once before the first deploy:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl -n towers create secret generic pocketbase-admin \
  --from-literal=email=ADMIN_EMAIL --from-literal=password=ADMIN_PASSWORD
```

### Without Skaffold

After the images for the tag in `k8s/kustomization.yaml` have been pushed:

```bash
kubectl -n towers delete job pocketbase-setup --ignore-not-found
kubectl apply -k k8s
```

## Verify

```bash
kubectl get pods -n towers -w
kubectl get ingress -n towers
kubectl logs -n towers -l app=towers -c server -f
kubectl logs -n towers -l app=towers -c client -f
```

## TLS

`ingress.yaml` references a secret named `bevsoft-wildcard-tls`. If it lives in a different namespace, copy it across:

```bash
kubectl get secret bevsoft-wildcard-tls -n SOURCE_NS -o yaml | \
  sed 's/namespace: SOURCE_NS/namespace: towers/' | \
  kubectl apply -f -
```

Alternatively, apply `certificate.yaml` to have cert-manager issue a fresh cert into the `towers` namespace.
