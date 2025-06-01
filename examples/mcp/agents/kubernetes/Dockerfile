FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends \
  bash \
  curl \
  git \
  wget \
  ca-certificates

RUN curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/$(dpkg --print-architecture)/kubectl" \
  && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl \
  && rm kubectl
RUN curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
WORKDIR /app

