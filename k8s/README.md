# Kubernetes Manifests

## Build & Deploy

### Prerequisites
- Docker buildx enabled: `docker buildx create --use` (once only)
- Logged in to Docker Hub: `docker login`
- kubectl pointing at your OKE cluster

### 1. Build and push multi-arch images
OKE runs ARM64 hosts — images must target both `linux/arm64` and `linux/amd64`.

```bash
export DOCKER_USER=your-dockerhub-username

# Frontend + reverse proxy
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t $DOCKER_USER/onlyone-nginx:latest \
  --push \
  ./nginx

# Game server
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t $DOCKER_USER/onlyone-gameserver:latest \
  --push \
  ./gameserver
```

### 2. Update image references in deployment.yaml
Replace the placeholder image names with your Docker Hub ones:
- `ghcr.io/bevan/onlyone-nginx:latest` → `$DOCKER_USER/onlyone-nginx:latest`
- `ghcr.io/bevan/onlyone-gameserver:latest` → `$DOCKER_USER/onlyone-gameserver:latest`

### 3. Apply manifests
```bash
# First time only
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml   # edit values first

# Every deploy
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### 4. Verify
```bash
kubectl get pods -n onlyone -w
kubectl get ingress -n onlyone
kubectl logs -n onlyone -l app=gameserver -f
kubectl logs -n onlyone -l app=nginx -f
```

> **Note:** `certificate.yaml` and `cluster-issuer.yaml` are not needed — `bevsoft-wildcard-tls` already exists in the cluster. If it lives in a different namespace than `onlyone`, copy it across:
> ```bash
> kubectl get secret bevsoft-wildcard-tls -n SOURCE_NS -o yaml | \
>   sed 's/namespace: SOURCE_NS/namespace: onlyone/' | \
>   kubectl apply -f -
> ```
