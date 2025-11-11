FROM rust:1.75 as builder

WORKDIR /app

# Copy Cargo files first for better caching
COPY Cargo.toml Cargo.lock ./

# Copy source code
COPY src ./src

# Copy migrations if they exist
COPY migrations ./migrations 2>/dev/null || true

# Build the application
RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/target/release/hush-v2-server /app/hush-v2-server

# Expose port
EXPOSE 3001

# Run the application
CMD ["./hush-v2-server"]

