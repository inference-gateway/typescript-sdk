import {
  DecisionQuestionType,
  InferenceGatewayClient,
  Provider,
} from '@inference-gateway/sdk';

const main = async () => {
  const client = new InferenceGatewayClient({
    baseURL: 'http://localhost:8080/v1',
  });

  try {
    console.log('Asking whether a message is spam');

    const decision = await client.createDecision(
      {
        model: 'openai/gpt-6-luna',
        input: 'Buy now!!!',
        questions: [
          {
            type: DecisionQuestionType.predicate,
            name: 'is_spam',
            instructions: 'Is this message unsolicited marketing spam?',
          },
        ],
      },
      Provider.openai
    );

    console.log('Answers:', JSON.stringify(decision.answers, null, 2));
    if (decision.usage) {
      console.log('Usage:', decision.usage);
    }
  } catch (error) {
    console.error('Error creating decision:', error);
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
