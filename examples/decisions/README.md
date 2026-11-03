# Decisions Example

This example demonstrates the OpenAI Decisions API relay with the Inference
Gateway SDK: it sends one input and a predicate question to `createDecision`
and prints the structured answer.

## Getting Started

1. Ensure you have the Inference Gateway running locally or have access to an
   instance. If not, please read the [Quick Start](../README.md#quick-start)
   section in the main README.

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Run the example:

   ```bash
   npm start
   ```

## Notes

- Only OpenAI supports the Decisions API today; other providers return an
  error from the gateway.
- The example uses `openai/gpt-6-luna` and a single `predicate` question
  (`is_spam`). Question types are `predicate`, `choice` and `score`.
