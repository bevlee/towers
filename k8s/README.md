# Kubernetes Manifests

Deploys Two Towers to a Kubernetes cluster behind Traefik with a wildcard TLS cert.

A parallel dev environment (namespace `towers-dev`, `towers-dev.bevsoft.com`, `:dev`
image tags, its own database) lives in `../k8s-dev/` — see its README. If you change
manifests here, mirror the change there.

## Files

| File | Purpose |
|------|---------|
| `namespace.yaml` | Creates the `towers` namespace |
| `deployment.yaml` | Single pod with two containers: `client` (nginx, port 80) and `server` (Node.js, port 3000) |
| `service.yaml` | ClusterIP services: `nginx` (port 80) and `gameserver` (port 3000) |
| `ingress.yaml` | Traefik ingress for `towers.bevsoft.com` with TLS; routes `/socket.io/` to `gameserver`, everything else to `nginx` |
| `certificate.yaml` | cert-manager Certificate for `*.bevsoft.com` (creates `bevsoft-wildcard-tls`) |

Both containers run in the same pod, so the server is reachable at `127.0.0.1:3000` from the nginx container (see `GAMESERVER_HOST` / `GAMESERVER_PORT` env vars).

## Deploy

`skaffold.yaml` (repo root) builds both images for amd64 + arm64, tags them with the
version in `build.tagPolicy`, pushes them to Docker Hub and applies every manifest in
`k8s/`. The server creates its Postgres tables on startup, so there is no separate
schema step.

Needs `skaffold` v2, `kubectl` pointed at the cluster, `docker login`, and Docker buildx.

```bash
skaffold run
kubectl -n towers rollout status deployment/towers --timeout=5m
```

**New release:** bump `template:` in `skaffold.yaml`, commit, `git tag vX.Y`, `skaffold run`.

**Roll back / redeploy an existing tag** without rebuilding: `skaffold deploy -t v1.4`.

**First install only:** the server reads `DATABASE_URL` from the `towers-db` Secret, which
is not in this repo. It was provisioned with the kubernetes-postgres-database skill
(database `towers`, owner `towers_user`, on `postgres.db.svc.cluster.local:5432`).
Sign-in uses the shared Better Auth service at `https://auth.bevsoft.com` (`AUTH_URL`).

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
