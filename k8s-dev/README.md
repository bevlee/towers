# Dev Environment

A full copy of the towers stack (including its own PocketBase) in the `towers-dev`
namespace, so PocketBase-dependent features can be tested in-cluster without touching
prod or setting up PocketBase locally.

| Prod | Dev |
|------|-----|
| namespace `towers` | namespace `towers-dev` |
| https://towers.bevsoft.com | https://towers-dev.bevsoft.com |
| https://pbtowers.bevsoft.com | https://pbtowers-dev.bevsoft.com |
| images `:vX.Y` | images `:dev` |

These manifests are copies of `k8s/` with namespace, hostnames, and image tags changed.
If you change something in `k8s/` (including `pocketbase/setup-configmap.yaml`), mirror it here.

## Deploy with Skaffold

```bash
skaffold run -p dev
kubectl -n towers-dev rollout status deployment/towers --timeout=5m
```

The `dev` profile builds and pushes `:dev` images and applies everything in `k8s-dev/`
and `k8s-dev/pocketbase/` to `towers-dev`, re-running the PocketBase setup Job like the
prod deploy. The admin secret is not deployed — create it once (see First-time setup).

DNS: `*.bevsoft.com` must resolve to the cluster's load balancer for the new hostnames
to work. If you use individual DNS records instead of a wildcard, add records for
`towers-dev.bevsoft.com` and `pbtowers-dev.bevsoft.com`.

## First-time setup

```bash
kubectl apply -f k8s-dev/namespace.yaml

# Admin credentials (use different ones from prod!)
kubectl -n towers-dev create secret generic pocketbase-admin \
  --from-literal=email=ADMIN_EMAIL --from-literal=password=ADMIN_PASSWORD

skaffold run -p dev
```

## Every deploy

```bash
skaffold run -p dev
```

This also re-runs the PocketBase setup Job, so schema changes are picked up.

## Verify

```bash
kubectl get pods -n towers-dev -w
kubectl logs -n towers-dev -l app=towers -c server -f
kubectl logs -n towers-dev -l app=pocketbase -f
kubectl logs -n towers-dev job/pocketbase-setup
```

Then open https://towers-dev.bevsoft.com.

## Tear down

Everything lives in the namespace, so:

```bash
kubectl delete namespace towers-dev
```

Note: the PocketBase PVC (`oci-bv` block volume) is deleted with the namespace —
dev data is disposable by design.
