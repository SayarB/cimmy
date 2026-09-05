FROM debian:bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    git \
    zsh \
  && rm -rf /var/lib/apt/lists/*

# Cursor Agent CLI (`agent`) — required when CIMMY_AGENT_STUB=0.
# Auth at runtime via CURSOR_API_KEY (passed from platform; never bake keys into the image).
RUN curl -fsS https://cursor.com/install | bash \
  && ln -sf /root/.local/bin/agent /usr/local/bin/agent \
  && agent --version

COPY fixtures/sample-repo /opt/cimmy/fixture
COPY docker/cursor-runtime/entrypoint.sh /usr/local/bin/cimmy-entrypoint.sh
RUN chmod +x /usr/local/bin/cimmy-entrypoint.sh \
  && mkdir -p /work /out

ENV PATH="/root/.local/bin:${PATH}"

WORKDIR /work
ENTRYPOINT ["/usr/local/bin/cimmy-entrypoint.sh"]
