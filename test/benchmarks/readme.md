# Benchmarks

Run `pnpm bench` to compare the current implementation with the committed baseline. Run `pnpm bench:baseline` to replace that baseline with measurements from the current machine.

The baseline uses Vitest 5's JSON reporter format. The benchmark helper reads its stored measurements through `bench.from()`; the former Vitest 4 baseline format is incompatible.

Use the same machine and Node.js version when comparing results. Regenerate the baseline deliberately after changing the benchmark implementation or tooling.
