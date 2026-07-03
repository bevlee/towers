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

Both containers run in the same pod, so the server is reachable at `127.0.0.1:3000` from the nginx container (see `GAMESERVER_HOST` / `GAMESERVER_PORT` env vars).

## Prerequisites

- Docker buildx: `docker buildx create --use` (once only)
- Logged in to Docker Hub: `docker login`
- kubectl pointing at the target cluster
- cert-manager installed in the cluster (for `certificate.yaml`)
- Traefik installed as the ingress controller

## Build and push images

OKE runs ARM64 hosts — images must target both `linux/arm64` and `linux/amd64`.

From the `towers/` directory:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t bevdev1/towers-client:v1.0 \
  -f client/Dockerfile \
  . \
  --push

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t bevdev1/towers-server:v1.0 \
  -f server/Dockerfile \
  . \
  --push
```

If you bump the tag, update `deployment.yaml` to match.

## Apply manifests

```bash
# First time only
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/certificate.yaml   # skip if bevsoft-wildcard-tls already exists

# Every deploy
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### Force a re-pull of the current image tag

The deployment sets `imagePullPolicy: Always`, so pods always pull on start — but Kubernetes won't recreate pods if nothing in the spec changed. To pull fresh images without bumping the tag:

```bash
kubectl rollout restart deployment/towers -n towers
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
