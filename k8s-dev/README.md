# Dev Environment

A full copy of the towers stack in the `towers-dev` namespace, with its own Postgres
database, so account and stats features can be tested in-cluster without touching prod.
Both environments sign in through the shared Better Auth service at auth.bevsoft.com.

| Prod | Dev |
|------|-----|
| namespace `towers` | namespace `towers-dev` |
| https://towers.bevsoft.com | https://towers-dev.bevsoft.com |
| database `towers` (Secret `towers-db`) | database `towers_dev` (Secret `towers-dev-db`) |
| images `:vX.Y` | images `:dev` |

These manifests are copies of `k8s/` with namespace, hostnames, and image tags changed.
If you change something in `k8s/`, mirror it here.

## Deploy with Skaffold

```bash
skaffold run -p dev
kubectl -n towers-dev rollout status deployment/towers --timeout=5m
```

The `dev` profile builds and pushes `:dev` images and applies everything in `k8s-dev/`
to `towers-dev`. The `towers-dev-db` Secret is not deployed (see First-time setup).

DNS: `*.bevsoft.com` must resolve to the cluster's load balancer for the new hostnames
to work. If you use individual DNS records instead of a wildcard, add records for
`towers-dev.bevsoft.com`.

## First-time setup

```bash
kubectl apply -f k8s-dev/namespace.yaml

# Provision database towers_dev and Secret towers-dev-db with the
# kubernetes-postgres-database skill (already done for this cluster).

skaffold run -p dev
```

## Every deploy

```bash
skaffold run -p dev
```

The server applies schema changes on startup.

## Verify

```bash
kubectl get pods -n towers-dev -w
kubectl logs -n towers-dev -l app=towers -c server -f
```

Then open https://towers-dev.bevsoft.com.

## Tear down

Everything lives in the namespace, so:

```bash
kubectl delete namespace towers-dev
```

The `towers_dev` database lives in the shared `db` namespace and survives this; drop it
there if you want it gone.
