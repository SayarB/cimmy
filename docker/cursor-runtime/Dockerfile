FROM debian:bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    git \
    zsh \
  && rm -rf /var/lib/apt/lists/*

# Cursor Agent CLI install is environment-specific; phase-1 smoke uses CIMMY_AGENT_STUB=1.
# Operators can extend this image to install `agent` for real runs.

COPY fixtures/sample-repo /opt/cimmy/fixture
COPY docker/cursor-runtime/entrypoint.sh /usr/local/bin/cimmy-entrypoint.sh
RUN chmod +x /usr/local/bin/cimmy-entrypoint.sh \
  && mkdir -p /work /out

WORKDIR /work
ENTRYPOINT ["/usr/local/bin/cimmy-entrypoint.sh"]
