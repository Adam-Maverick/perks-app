# Qwen 2.5 Coder on Colab - Notebook as Database

## Overview

This guide documents the "Notebook as Database" workflow using Google Colab to run **Qwen 2.5 Coder 32B** - a state-of-the-art open-source code generation model that outperforms GPT-4 on coding benchmarks.

**Model Performance:**
- HumanEval: 92.7% (outperforms GPT-4 and DeepSeek)
- MBPP: 90.2%
- Supports 92+ programming languages

## Workflow Architecture

The `.ipynb` file serves as both a **request queue** and **response store**:
1. Amelia (Dev Agent) writes prompts to `qwen_bridge.ipynb`
2. You execute cells in Google Colab (free T4 GPU)
3. Qwen generates code and saves output to the notebook
4. Amelia reads the output and integrates the code

## Phase 1: Colab Runtime Setup

1. Go to [Google Colab](https://colab.research.google.com/)
2. Upload `qwen_bridge.ipynb` or create a new notebook
3. **Critical:** Go to **Runtime > Change runtime type** and select **T4 GPU**
4. Run the setup cell:

```python
# 1. Install Ollama
!curl -fsSL https://ollama.com/install.sh | sh

# 2. Start Ollama in the background
import subprocess
import time

# Start the server
process = subprocess.Popen(["ollama", "serve"])
time.sleep(5)  # Give it a moment to start

# 3. Pull the Qwen 2.5 Coder model (32B is state-of-the-art for code generation)
# Qwen 2.5 Coder 32B scored 92.7% on HumanEval, outperforming DeepSeek and GPT-4
!ollama pull qwen2.5-coder:32b

print("✅ Qwen 2.5 Coder Ready!")
```

## Phase 2: The Bridge Function

Define this helper function in Colab to interact with Qwen:

```python
import requests
import json

def ask_qwen(prompt, model="qwen2.5-coder:32b"):
    """Send a prompt to Qwen 2.5 Coder and get the response."""
    url = "http://localhost:11434/api/generate"
    data = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    response = requests.post(url, json=data)
    return response.json()['response']
```

## Phase 3: Execution Workflow

### Option A: Google Drive Sync (Recommended)
1. Save `qwen_bridge.ipynb` to your Google Drive folder
2. In Colab: **Folder Icon** (left sidebar) → **Mount Drive**
3. Navigate to and open your notebook
4. When Amelia updates prompts locally, refresh in Colab, run cells, and save
5. Amelia reads updated outputs automatically

### Option B: Manual Copy-Paste
1. Amelia writes prompts to local `qwen_bridge.ipynb`
2. You copy prompts from the notebook
3. Paste into Colab: `print(ask_qwen("your prompt here"))`
4. Copy generated code back to the notebook or share in chat

## Verified Test Results

The workflow has been tested with three production-grade scenarios:

### Test 1: Email Validation Function
- **Prompt:** TypeScript email validator with regex and JSDoc
- **Output:** Clean function with proper types, error handling, and documentation
- **Quality:** Production-ready ✓

### Test 2: Next.js Server Action
- **Prompt:** Server action with Supabase integration
- **Output:** Complete implementation with types, error handling, and usage examples
- **Quality:** Production-ready ✓

### Test 3: Paystack Webhook Verification
- **Prompt:** HMAC SHA512 signature verification
- **Output:** Secure implementation with crypto module and comprehensive docs
- **Quality:** Production-ready ✓

## Performance Analysis

**Speed Comparison:**
- **Qwen 2.5 Coder (32B on Colab T4):** ~10+ minutes for 3 complex functions
- **Gemini 2.0 Flash:** ~30-60 seconds for equivalent output
- **Claude 3.5 Sonnet:** ~20-40 seconds for equivalent output

**Verdict:** Qwen is significantly slower than commercial APIs despite free GPU access.

## When to Use Qwen vs. Gemini

### ✅ Use Qwen 2.5 Coder When:
- **Rate limits hit:** You've exhausted Gemini API quotas
- **Batch processing:** Generating multiple boilerplate files overnight (non-blocking)
- **Learning/experimentation:** Testing different prompting strategies without cost
- **Offline work:** No internet access but Colab session is active
- **Privacy-sensitive code:** Keeping proprietary logic off commercial APIs

### ✅ Use Gemini/Claude When:
- **Active development:** Real-time coding assistance needed
- **Time-sensitive tasks:** Sprint deadlines, bug fixes, urgent features
- **Interactive workflows:** Back-and-forth refinement with the agent
- **Complex reasoning:** Multi-step problem solving requiring fast iteration
- **Default choice:** For 95% of development work

## Decision Criteria Summary

| Factor | Qwen 2.5 Coder | Gemini 2.0 Flash |
|--------|----------------|------------------|
| **Speed** | 10+ min/task | 30-60 sec/task |
| **Cost** | Free (Colab) | Token-based |
| **Quality** | 92.7% HumanEval | GPT-4 class |
| **Use Case** | Batch/offline | Real-time dev |
| **Latency** | High | Low |
| **Best For** | Rate limit backup | Primary tool |

## Recommendations

1. **Primary Tool:** Continue using Gemini/Claude for active development
2. **Backup Strategy:** Keep Qwen bridge ready for rate limit scenarios
3. **Batch Jobs:** Use Qwen for overnight generation of test fixtures, mock data, or boilerplate
4. **Cost Optimization:** Monitor token usage; switch to Qwen only if costs become prohibitive

## Technical Notes

- **State Management:** Notebook cells execute sequentially; no concurrent request handling
- **Version Control:** Commit `qwen_bridge.ipynb` for audit trail of generated code
- **Validation:** Always run generated code through linters (ESLint, TypeScript) before integration
- **Error Rate:** Even at 92.7% accuracy, expect ~7.3% of outputs to need manual fixes

## Conclusion

The "Notebook as Database" pattern is **architecturally sound but operationally slow**. It serves as an excellent **fallback** for rate-limited scenarios but should not replace fast commercial APIs for day-to-day development.

**Status:** Spike complete ✓ | Workflow documented ✓ | Decision criteria defined ✓
