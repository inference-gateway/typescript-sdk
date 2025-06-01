/**
 * Interactive Kubernetes Operations Agent
 *
 * This agent specializes in Kubernetes cluster management, deployment automation,
 * and container orchestration using Context7 MCP tools for up-to-date K8s documentation.
 */

import {
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '@inference-gateway/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

dotenv.config({ path: path.join(__dirname, '.env') });

declare const require: any;
declare const module: any;

interface AgentConfig {
  client: InferenceGatewayClient;
  provider: Provider;
  model: string;
  conversationHistory: Array<{ role: MessageRole; content: string }>;
  maxRetries: number;
  retryDelayMs: number;
}

class KubernetesAgent {
  private config: AgentConfig;
  private rl: readline.Interface;

  constructor() {
    this.config = {
      client: new InferenceGatewayClient({
        baseURL: 'http://localhost:8080/v1',
      }),
      provider: (process.env.PROVIDER as Provider) || Provider.groq,
      model: process.env.LLM || 'llama-3.3-70b-versatile',
      conversationHistory: [],
      maxRetries: 3,
      retryDelayMs: 60000,
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.config.conversationHistory.push({
      role: MessageRole.system,
      content: this.getSystemPrompt(),
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      global.setTimeout(() => resolve(), ms);
    });
  }

  private async waitForKubernetesOperation(): Promise<void> {
    console.log(
      '⏳ Waiting 10 seconds for Kubernetes operation to complete...'
    );
    await this.delay(10000);
    console.log('✅ Kubernetes operation wait period completed.\n');
  }

  private getSystemPrompt(): string {
    return `
You are an expert Kubernetes operations assistant with access to Context7 MCP tools for K8s documentation and research. Today is **June 1, 2025**.

---

### 🔧 CORE RESPONSIBILITIES

You help users with **Kubernetes cluster operations and container orchestration** by:

1. Understanding deployment requirements and recommending optimal K8s strategies
2. Using **Context7 tools** to retrieve up-to-date Kubernetes documentation and best practices
3. Creating production-ready YAML manifests and Helm charts
4. Following Kubernetes security and performance conventions
5. Providing cluster management, monitoring, and troubleshooting guidance

---

### 🧰 AVAILABLE TOOLS

You have access to several MCP tool categories:

**Context7 Tools (@upstash/context7-mcp):**

* c41_resolve-library-id: Resolve technology names to Context7-compatible IDs
* c41_get-library-docs: Fetch full documentation, usage examples, and best practices

**Mock Tools (for local/demo use):**

* search_libraries: Search for libraries by name or functionality
* get_library_details: Fetch library metadata and features
* get_documentation: Fetch usage examples and implementation patterns

**Memory Tools (for error recovery):**

* save-state: Save current progress/state with a session ID
* save-error-state: Save state when HTTP errors occur for recovery
* restore-state: Restore previously saved state by session ID
* list-sessions: List all saved sessions
* clear-session: Remove a saved session

**File System Tools:**

* Available for file operations in /tmp directory

---

### 🛡️ ERROR RECOVERY STRATEGY

When encountering HTTP errors or failures:

1. Immediately save state using save-error-state with:
   - Unique session ID (e.g., "k8s-task-{timestamp}")
   - Current progress/context
   - Error details
2. In subsequent runs, check for existing sessions with list-sessions
3. Restore state if needed and continue from where you left off
4. Clear sessions when tasks complete successfully

---

### 📂 FILE SYSTEM RULES

* All Kubernetes manifests and generated files must **use the /tmp directory exclusively**.
* If **Kubernetes configurations already exist in /tmp**, continue working within them instead of creating new ones.
* You must **never overwrite** existing configurations unless explicitly asked.

---

### ⚙️ DEVELOPMENT WORKFLOW

**Always use Context7 tools before creating K8s resources:**

**Always list the files in a directory before creating new manifests.**

**When applying K8s configurations, always wait 10 seconds after operation.**

1. Clarify requirements and deployment architecture
2. Lookup Kubernetes and related technologies using Context7 tools
3. Retrieve current documentation, patterns, and best practices
4. Create or enhance configurations under /tmp, maintaining clean structure
5. Follow K8s conventions, security policies, and resource management
6. Include proper monitoring, logging, and health check configurations
7. Prioritize scalability, reliability, and operational excellence

---

### ☸️ KUBERNETES RESOURCE RULES

* **Use the latest Kubernetes API versions and best practices**
* **Follow security-first approach with RBAC, network policies, and pod security**
* **Structure should include:**
  * Namespace definitions
  * Deployment/StatefulSet manifests
  * Service and Ingress configurations
  * ConfigMaps and Secrets
  * RBAC policies (ServiceAccount, Role, RoleBinding)
  * NetworkPolicies for security
  * HorizontalPodAutoscaler for scaling
  * PodDisruptionBudget for availability

**Supported Kubernetes Resources:**
* **Workloads:** Deployments, StatefulSets, DaemonSets, Jobs, CronJobs
* **Services:** ClusterIP, NodePort, LoadBalancer, ExternalName
* **Configuration:** ConfigMaps, Secrets, PersistentVolumes
* **Security:** RBAC, NetworkPolicies, PodSecurityPolicies
* **Scaling:** HPA, VPA, Cluster Autoscaler
* **Networking:** Ingress, Service Mesh (Istio/Linkerd)

If Kubernetes configurations exist:
* Validate API versions and resource definitions
* Extend or modify as needed based on requirements
* Optimize for performance, security, and cost

---

### 🧪 KUBERNETES ECOSYSTEM (verify latest versions with Context7)

**Core:** kubectl, kubelet, kube-apiserver, etcd, kube-controller-manager
**Container Runtime:** containerd, Docker, CRI-O
**Networking:** Calico, Flannel, Weave, Cilium
**Service Mesh:** Istio, Linkerd, Consul Connect
**Monitoring:** Prometheus, Grafana, Jaeger, Kiali
**CI/CD:** ArgoCD, Flux, Tekton, Jenkins X
**Package Management:** Helm, Kustomize, Operator Framework
**Security:** Falco, Open Policy Agent (OPA), Twistlock
**Storage:** Longhorn, Rook, OpenEBS, Portworx

---

### 🚀 COMMON KUBERNETES PATTERNS TO LEVERAGE

* **Microservices Architecture** with proper service decomposition
* **GitOps Deployment** with declarative configurations
* **Blue-Green Deployments** for zero-downtime updates
* **Canary Releases** for safe rollouts
* **Resource Quotas** and limits for multi-tenancy
* **Health Checks** (liveness, readiness, startup probes)
* **Secrets Management** with external secret operators
* **Observability** with distributed tracing and metrics

---

### 🛡️ SECURITY BEST PRACTICES

* **Principle of Least Privilege** with RBAC
* **Network Segmentation** with NetworkPolicies
* **Pod Security Standards** enforcement
* **Image Security** scanning and admission controllers
* **Secret Rotation** and external secret management
* **Audit Logging** for compliance and monitoring
* **Resource Isolation** with namespaces and quotas

---

### 📊 OPERATIONAL EXCELLENCE

* **Infrastructure as Code** with Terraform/Pulumi
* **Automated Scaling** based on metrics
* **Disaster Recovery** planning and testing
* **Cost Optimization** with resource right-sizing
* **Performance Monitoring** and alerting
* **Capacity Planning** for growth
* **Multi-cluster Management** for resilience

---

### ✅ SUMMARY

* Always work in /tmp
* If K8s configurations exist, enhance them — don't recreate
* Use Context7 tools for everything: K8s decisions, patterns, and examples
* Follow security-first, cloud-native principles
* Adhere to modern best practices in cluster operations, security, and reliability
`;
  }

  async initialize(): Promise<void> {
    console.log(
      `☸️  Kubernetes Operations Agent initialized using ${this.config.model} on ${this.config.provider}\n`
    );

    let attempt = 0;
    while (attempt < this.config.maxRetries) {
      try {
        // Health check
        const isHealthy = await this.config.client.healthCheck();
        if (!isHealthy) {
          console.error('❌ Gateway unhealthy. Run: docker-compose up --build');
          process.exit(1);
        }

        const tools = await this.config.client.listTools();
        const realContext7Tools = tools.data.filter((tool) =>
          ['c41_resolve-library-id', 'c41_get-library-docs'].includes(tool.name)
        );
        const mockContext7Tools = tools.data.filter((tool) =>
          [
            'search_libraries',
            'get_library_details',
            'get_documentation',
          ].includes(tool.name)
        );

        const context7Tools = [...realContext7Tools, ...mockContext7Tools];

        if (context7Tools.length === 0) {
          console.error(
            '⚠️  No Context7 MCP tools available. Make sure a Context7 MCP server is running.'
          );
          console.error(
            '   For real Context7: npx -y @upstash/context7-mcp@latest'
          );
          console.error(
            '   For local mock: docker-compose up --build (already included in this project)'
          );
          process.exit(1);
        }

        const usingRealContext7 = realContext7Tools.length > 0;
        const toolType = usingRealContext7 ? 'real Context7' : 'mock Context7';

        console.info(
          `📋 Found ${context7Tools.length} ${toolType} tools available:`
        );
        context7Tools.forEach((tool, index) => {
          console.info(`  ${index + 1}. ${tool.name} - ${tool.description}`);
        });

        if (!usingRealContext7) {
          console.info('💡 Using local mock Context7 server for demonstration');
          console.info(
            '   To use real Context7 with latest docs, install: npx -y @upstash/context7-mcp@latest'
          );
        }
        console.info('');

        this.showWelcomeMessage();
        await this.startInteractiveSession();
        break;
      } catch (error) {
        attempt++;
        console.error(
          `❌ Initialization Error (attempt ${attempt}/${this.config.maxRetries}):`,
          (error as Error).message
        );

        if (attempt < this.config.maxRetries) {
          console.log(
            `⏳ Retrying in ${this.config.retryDelayMs / 1000} seconds...`
          );
          await this.delay(this.config.retryDelayMs);
        } else {
          console.error(
            `❌ Failed to initialize after ${this.config.maxRetries} attempts`
          );
          console.log(
            '\n💡 Make sure the Context7 MCP server is running on port 3002'
          );
          console.log('   and the Inference Gateway is running on port 8080');
          process.exit(1);
        }
      }
    }
  }

  private showWelcomeMessage(): void {
    console.log('☸️  Welcome to Kubernetes Operations Agent!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      '\n💡 I specialize in Kubernetes cluster operations and container orchestration.'
    );
    console.log(
      "   Just describe what you want to deploy or manage, and I'll use Context7"
    );
    console.log(
      '   to get up-to-date K8s documentation and create production-ready solutions.'
    );
    console.log('\n📝 Example requests:');
    console.log(
      '   • "Deploy a scalable web application with load balancing and auto-scaling"'
    );
    console.log(
      '   • "Create a microservices architecture with service mesh and monitoring"'
    );
    console.log(
      '   • "Set up a CI/CD pipeline with GitOps and automated deployments"'
    );
    console.log(
      '   • "Configure RBAC and network policies for multi-tenant cluster"'
    );
    console.log(
      '   • "Deploy a database cluster with persistent storage and backups"'
    );
    console.log('\n⚡ Commands:');
    console.log('   • Type your request to start building');
    console.log('   • Use "clear" to reset conversation history');
    console.log('   • Use "exit" or "quit" to end the session');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  private async startInteractiveSession(): Promise<void> {
    while (true) {
      const userInput = await this.getUserInput(
        '☸️  What would you like to deploy or manage in Kubernetes? '
      );

      if (this.handleSpecialCommands(userInput)) {
        continue;
      }

      if (userInput.trim()) {
        await this.processUserRequestWithRetry(userInput);
      }
    }
  }

  private async getUserInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  private handleSpecialCommands(input: string): boolean {
    const command = input.trim().toLowerCase();

    switch (command) {
      case 'exit':
      case 'quit':
        console.log('\n👋 Thank you for using Kubernetes Agent! Goodbye!');
        this.rl.close();
        process.exit(0);
        return true;

      case 'clear':
        this.config.conversationHistory = [
          {
            role: MessageRole.system,
            content: this.getSystemPrompt(),
          },
        ];
        console.log('\n🧹 Conversation history cleared. Starting fresh!\n');
        return true;

      case 'help':
        this.showWelcomeMessage();
        return true;

      default:
        return false;
    }
  }

  private async processUserRequestWithRetry(userInput: string): Promise<void> {
    let attempt = 0;

    while (attempt < this.config.maxRetries) {
      try {
        await this.processUserRequest(userInput);
        break;
      } catch (error) {
        attempt++;
        console.error(
          `❌ Request failed (attempt ${attempt}/${this.config.maxRetries}):`,
          (error as Error).message
        );

        if (attempt < this.config.maxRetries) {
          console.log(
            `⏳ Retrying in ${this.config.retryDelayMs / 1000} seconds...`
          );
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          await this.delay(this.config.retryDelayMs);
        } else {
          console.error(
            `❌ Failed to process request after ${this.config.maxRetries} attempts`
          );
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
      }
    }
  }

  private async processUserRequest(userInput: string): Promise<void> {
    console.log(`\n🔍 Processing Kubernetes request: "${userInput}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    this.config.conversationHistory.push({
      role: MessageRole.user,
      content: userInput,
    });

    let assistantResponse = '';
    let shouldWaitForOperation = false;

    await this.config.client.streamChatCompletion(
      {
        model: `${this.config.provider}/${this.config.model}`,
        messages: this.config.conversationHistory,
        max_tokens: 2000,
      },
      {
        onOpen: () => {
          console.log(
            '🔗 Starting Kubernetes operations session with Context7...\n'
          );
        },
        onReasoning: (reasoning) => {
          console.log(`\n🤔 Agent Reasoning: ${reasoning}`);
        },
        onContent: (content) => {
          process.stdout.write(content);
          assistantResponse += content;
        },
        onMCPTool: (toolCall: any) => {
          console.log(`\n🛠️  Context7 Tool: ${toolCall.function.name}`);
          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.log(`📝 Arguments:`, JSON.stringify(args, null, 2));
          } catch {
            console.log(`📝 Raw Arguments: ${toolCall.function.arguments}`);
          }
          console.log(`🔍 Tool ID: ${toolCall.id}\n`);

          if (
            toolCall.function.name.toLowerCase().includes('kubernetes') ||
            toolCall.function.name.toLowerCase().includes('k8s') ||
            toolCall.function.name.toLowerCase().includes('kubectl') ||
            toolCall.function.name.toLowerCase().includes('deploy') ||
            toolCall.function.name.toLowerCase().includes('create')
          ) {
            console.log(
              '☸️  Kubernetes operation detected - will wait 10 seconds after completion'
            );
            shouldWaitForOperation = true;
          }
        },
        onError: (error) => {
          console.error(`\n❌ Stream Error: ${error.error}`);
          throw new Error(`Stream error: ${error.error}`);
        },
        onFinish: async () => {
          console.log('\n\n✅ Kubernetes operations session completed!\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

          if (shouldWaitForOperation) {
            await this.waitForKubernetesOperation();
          }

          // Add assistant response to conversation history
          if (assistantResponse.trim()) {
            this.config.conversationHistory.push({
              role: MessageRole.assistant,
              content: assistantResponse,
            });
          }
        },
      }
    );
  }

  async shutdown(): Promise<void> {
    this.rl.close();
  }
}

async function runKubernetesAgent(): Promise<void> {
  const agent = new KubernetesAgent();

  process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down Kubernetes Agent...');
    await agent.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n👋 Shutting down Kubernetes Agent...');
    await agent.shutdown();
    process.exit(0);
  });

  await agent.initialize();
}

if (
  require.main === module ||
  process.argv[1].endsWith('kubernetes-agent.ts')
) {
  runKubernetesAgent().catch(console.error);
}

export { KubernetesAgent, runKubernetesAgent };
