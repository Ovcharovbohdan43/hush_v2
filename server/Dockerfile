FROM rust:1.75 as builder

WORKDIR /app

# Copy only server directory
COPY server/Cargo.toml server/Cargo.lock ./
COPY server/src ./src
COPY server/migrations ./migrations

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

