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
If you change something in `k8s/`, mirror it here. The PocketBase setup-script ConfigMap
is *not* duplicated — it's applied from the prod file with the namespace swapped (see below).

DNS: `*.bevsoft.com` must resolve to the cluster's load balancer for the new hostnames
to work. If you use individual DNS records instead of a wildcard, add records for
`towers-dev.bevsoft.com` and `pbtowers-dev.bevsoft.com`.

## Build and push dev images

From the `towers/` directory (multi-arch, same as prod):

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t bevdev1/towers-client:dev \
  -f client/Dockerfile \
  . \
  --push

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t bevdev1/towers-server:dev \
  -f server/Dockerfile \
  . \
  --push
```

The `dev` tag is mutable — push over it freely, then restart to pull:

```bash
kubectl rollout restart deployment/towers -n towers-dev
```

## First-time setup

```bash
kubectl apply -f k8s-dev/namespace.yaml
kubectl apply -f k8s-dev/certificate.yaml   # cert-manager issues bevsoft-wildcard-tls into towers-dev

# Edit the admin credentials first (use different ones from prod!)
kubectl apply -f k8s-dev/pocketbase/secret.yaml

# PocketBase
kubectl apply -f k8s-dev/pocketbase/statefulset.yaml
kubectl apply -f k8s-dev/pocketbase/service.yaml
kubectl apply -f k8s-dev/pocketbase/ingress.yaml

# Setup script ConfigMap — reused from prod with the namespace swapped
sed 's/^  namespace: towers$/  namespace: towers-dev/' k8s/pocketbase/setup-configmap.yaml | \
  kubectl apply -f -
kubectl apply -f k8s-dev/pocketbase/setup-job.yaml

# App
kubectl apply -f k8s-dev/deployment.yaml
kubectl apply -f k8s-dev/service.yaml
kubectl apply -f k8s-dev/ingress.yaml
```

## Every deploy

```bash
# After pushing new :dev images
kubectl rollout restart deployment/towers -n towers-dev

# If manifests changed
kubectl apply -f k8s-dev/deployment.yaml
```

Re-run the PocketBase setup job after schema changes:

```bash
sed 's/^  namespace: towers$/  namespace: towers-dev/' k8s/pocketbase/setup-configmap.yaml | \
  kubectl apply -f -
kubectl delete job pocketbase-setup -n towers-dev --ignore-not-found
kubectl apply -f k8s-dev/pocketbase/setup-job.yaml
```

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
