# CLI_X - Natural Language to Shell Command Converter

[![Rust](https://img.shields.io/badge/rust-1.90%2B-orange.svg)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.4.0-blue.svg)](CHANGELOG.md)

> Transform natural language into safe, executable shell commands using LLM technology with intelligent context awareness.

## ✨ Features

**Phase 1** (Completed - Foundation):
- ✅ Natural language to shell command conversion
- ✅ LLM integration (OpenAI GPT-3.5/4, Groq support)
- ✅ **Enhanced Safety System** with ML-inspired risk scoring
- ✅ Interactive command confirmation with multi-layer validation
- ✅ **Cross-Platform Command Generation** (PowerShell/Bash)
- ✅ Context-aware safety analysis (privileges, sensitive directories)
- ✅ Impact analysis and safer alternative suggestions
- ✅ Audit logging and command history
- ✅ Docker containerization with dev/debug/production builds

**Phase 2** (Completed - Enhanced Safety & Multi-Provider):
- ✅ **Week 1-2**: Enhanced safety system with 11 comprehensive rules
- ✅ Rule-based pattern matching (Exact, Contains, Regex, Multiple)
- ✅ ML-inspired risk scoring algorithm (severity/context/pattern weighted)
- ✅ Environment context detection and sensitive directory awareness
- ✅ **Week 3-4**: Multi-provider LLM support (OpenAI, Groq, Anthropic, Local)
- ✅ **Week 5-6**: Interactive learning mode and command refinement
- ✅ **Week 7-8**: Error recovery and advanced workflows

**Phase 3** (Completed - Cross-Platform & Advanced Features):
- ✅ Platform detection and environment abstraction
- ✅ PowerShell and Bash command generators
- ✅ Advanced path handling and security validation
- ✅ Template system and pattern matching
- ✅ Cross-platform testing (100% passing)

**Phase 4** (Completed - Intelligence & Advanced Context):
- ✅ Context enrichment engine
- ✅ Intent analysis system (9 operation types)
- ✅ Conversation management (multi-turn support)
- ✅ Prompt engineering and optimization
- ✅ Response parsing and validation
- ✅ Intelligent orchestration pipeline

**Phase 5** (Completed - Production Ready v1.0.0):
- ✅ **Tasks 5.1-5.3**: Multi-provider LLM support (OpenAI, Anthropic, Ollama, Groq)
- ✅ **Task 5.4**: Intelligent response caching (40-60% API cost reduction)
- ✅ **Task 5.5**: Comprehensive user documentation (5,500+ lines)
- ✅ **Task 5.6**: Polished CLI experience with interactive mode
- ✅ **Task 5.7**: Distribution packages (7 methods, 5 platforms)

**🎉 v2.3.0** (Completed - Intelligence & Interactive Mode):
- ✅ **4-Stage Intelligence Pipeline** (28ms overhead)
  - Intent analysis with 17 intent types
  - Context enrichment from 5 sources
  - Prompt optimization for better LLM responses
  - Response parsing with ~95% accuracy
- ✅ **Platform-Native Command Generation**
  - Native Bash/PowerShell/Sh/Cmd generation
  - Intelligent path conversion including WSL
  - Platform auto-detection with override capability
- ✅ **Template System Enhancement** (60+ templates)
  - Interactive TUI browser with arrow key navigation
  - Smart template suggestions before LLM
  - Docker, Git, File, Network, System, Process categories
- ✅ **Complete Interactive Command Suite** (25+ commands)
  - help, history, stats, refine, explain, !N commands
  - All CLI flags accessible as interactive commands
  - Session state management with real-time toggles
- ✅ **Settings UI Clean Output**
  - Terminal cleared after TUI exit (including scrollback)
  - Concise summary instead of audit trail
- ✅ **Async Context Loading** (<100ms startup)
  - Non-blocking startup for responsive experience
  - Real-time context updates
- ✅ **Dependency Version Checking**
  - Multi-ecosystem support (Rust, Node.js, Python)
  - Registry API integration with 24-hour caching
- 📊 **760 tests passing** (100% pass rate, +75 from v2.2.0)
- 📚 **3,500+ lines** of new documentation
- ⚡ **28ms intelligence overhead** (well under 50ms target)

**🎉 v2.4.0** (Current - Major Feature Update):
- ✅ **Conversation Mode** - Multi-turn conversations with full context retention
  - Persistent conversation storage in SQLite
  - Context-aware responses that reference previous messages
  - Thread management (start, list, continue, show, delete)
  - Project and file-aware conversations
  - Export conversations for documentation
  
- ✅ **Workflow Automation** - Intelligent workflow recommendations
  - Automatic pattern detection from command history
  - Workflow recommendations with confidence scoring
  - Parameterized workflows with interactive prompts
  - Conditional execution (git branch, env vars, file existence)
  - Scheduled workflows with cron support
  - Template-based workflow composition
  
- ✅ **Ollama Integration** - Complete local model management
  - Model lifecycle management (list, pull, remove, info)
  - Model pre-loading for instant responses
  - Custom model creation with Modelfiles
  - Auto-preload configuration
  - Performance tuning (context size, temperature, batch size)
  - Native Ollama server status checking
  
- ✅ **Template Analytics** - Data-driven template optimization
  - Automatic usage tracking and success rate monitoring
  - Effectiveness scoring (0-100) for all templates
  - Failure pattern analysis and improvement suggestions
  - Template sharing and team collaboration (export/import)
  - Validation system for security and compatibility
  - Interactive template editing
  
- ✅ **Command Suggestions** - Proactive intelligent assistance
  - Context-based suggestions (git status, project type, directory)
  - Pattern prediction from command history
  - Proactive system alerts (Docker, disk space, dependencies)
  - Workflow automation opportunities
  - Template recommendations
  - User feedback tracking for continuous improvement
  
- 📊 **850+ tests passing** (100% pass rate, +90 from v2.3.0)
- 📚 **6,700+ lines** of new documentation (3,200+ for v2.4.0)
- 🚀 **40+ new CLI commands** across 6 categories
- ⚡ **<5ms suggestion generation** (negligible performance impact)

### Feature Status Legend
- ✅ **Available**: Fully implemented and accessible via CLI
- 🔧 **Backend Ready**: Code complete, CLI integration pending
- 🚧 **In Progress**: Actively being developed
- 📋 **Planned**: Scheduled for future version

**Note:** All v2.4.0 features are fully available and accessible via CLI.

## 🔒 Security

CLI_X prioritizes security with multiple protection layers:

- **0 Critical Vulnerabilities:** Comprehensive security audit completed
- **Memory Safe:** Rust prevents buffer overflows and memory errors
- **Command Injection Protection:** Safe argument passing prevents shell injection
- **API Key Security:** Encrypted transmission, secure storage, never logged
- **Network Security:** HTTPS everywhere, certificate validation enabled
- **Input Validation:** Comprehensive validation at all entry points
- **Audit Logging:** Complete command history tracking

See [SECURITY.md](SECURITY.md) for our security policy and vulnerability reporting.

## ⚡ Performance

CLI_X is optimized for speed and efficiency:

- **Startup Time**: ~90ms (40% faster than baseline)
- **Cache Lookups**: ~1.5ms average (70% faster with bloom filters)
- **Memory Usage**: ~36MB typical workload (40% reduction)
- **Binary Size**: ~4-6MB stripped (50% smaller than pre-optimization)
- **Response Time**: Sub-second for cached queries

Performance features:
- Intelligent caching with similarity detection
- Bloom filters for O(1) cache miss detection
- Early termination algorithms for string comparisons
- Copy-on-Write (Cow) strings to reduce allocations
- LTO and binary stripping for smaller downloads

Run benchmarks: `cargo bench`

## 🚀 Quick Start

### Installation

Choose your preferred installation method:

**Option 1: Cargo (Rust Package Manager)**
```bash
cargo install cli_x
```

**Option 2: Homebrew (macOS)**
```bash
brew tap tlex-web/cli_x
brew install cli_x
```

**Option 3: Package Managers (Linux)**
```bash
# Debian/Ubuntu
wget https://github.com/tlex-web/cli_x/releases/latest/download/cli_x_amd64.deb
sudo dpkg -i cli_x_amd64.deb

# RedHat/Fedora/CentOS
wget https://github.com/tlex-web/cli_x/releases/latest/download/cli_x.x86_64.rpm
sudo dnf install cli_x.x86_64.rpm
```

**Option 4: MSI Installer (Windows)**  
Download from [GitHub Releases](https://github.com/tlex-web/cli_x/releases) and run the installer.

**Option 5: Docker**
```bash
docker pull tlexweb/cli_x:latest
docker run -it --rm -e OPENAI_API_KEY=your_key tlexweb/cli_x:latest cli_x "list files"
```

**Option 6: Binary Downloads**  
Download pre-built binaries from [GitHub Releases](https://github.com/tlex-web/cli_x/releases)

**See [Installation Guide](docs/INSTALLATION.md) for detailed instructions**

### Quick Setup

After installation, configure your API key:

```bash
# Interactive setup
cli_x setup

# Or create config manually
mkdir -p ~/.cli_x
echo '{"llm_provider":"openai","openai_api_key":"your-key","model":"gpt-4"}' > ~/.cli_x/config.json

# Or use environment variable
export OPENAI_API_KEY="your-key"
```

### Usage

```bash
# Basic usage
cli_x "list files in current directory"

# Interactive mode
cli_x interactive

# Get help
cli_x --help
```

### v2.4.0 New Features Quick Start

**Start a Conversation:**
```bash
# Multi-turn conversation with context retention
cli_x conversation start

# Continue a previous conversation
cli_x conversation list
cli_x conversation continue conv_abc123
```

**Get Workflow Recommendations:**
```bash
# Analyze your command history for patterns
cli_x workflow recommend

# Get context-aware workflow suggestions
cli_x workflow suggest
```

**Manage Ollama Models:**
```bash
# List installed models
cli_x ollama list

# Pull and preload a model for instant responses
cli_x ollama pull qwen2.5-coder:7b
cli_x ollama preload qwen2.5-coder:7b

# Configure CLI_X to use Ollama
cli_x config set llm.provider ollama
cli_x config set llm.model qwen2.5-coder:7b
```

**Track Template Usage:**
```bash
# View template analytics
cli_x template track stats
cli_x template track top

# Get effectiveness scores
cli_x template track effectiveness
```

**Get Command Suggestions:**
```bash
# Show intelligent suggestions based on context
cli_x suggest show

# Accept/dismiss suggestions to improve future recommendations
cli_x suggest accept <id>
cli_x suggest dismiss <id>
```

**See [Documentation](#-documentation) for comprehensive guides on all v2.4.0 features.**

## 📖 Documentation

### 🚀 Quick Start Guides

- **[Installation Guide](docs/INSTALLATION.md)** - Complete installation instructions for all platforms
- **[Setup Guide](docs/SETUP.md)** - First-time configuration and API key setup
- **[Quick Configuration](CONFIG_GUIDE.md)** - Fast configuration reference (getting started)
- **[Usage Guide](docs/USAGE.md)** - Complete usage guide with all v2.3.0 features

### 📚 User Guides

- **[Configuration Reference](docs/CONFIGURATION.md)** - Comprehensive configuration options
- **[Multi-Provider Setup](docs/MULTI_PROVIDER.md)** - Configure OpenAI, Groq, Anthropic, and Ollama
- **[Safety System](docs/SAFETY.md)** - 🛡️ Enhanced safety features, rules, and risk levels
- **[Examples & Patterns](docs/EXAMPLES.md)** - Real-world usage scenarios
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Platform Support](docs/PLATFORM_SUPPORT.md)** - Cross-platform command generation

### ✨ v2.4.0 Feature Guides (NEW!)

- **[Conversation Mode](docs/CONVERSATION_MODE.md)** - 💬 Multi-turn conversations with context retention (~900 lines)
- **[Workflow Automation](docs/WORKFLOW_AUTOMATION.md)** - 🔄 Pattern detection and workflow recommendations (~1,000 lines)
- **[Ollama Integration](docs/OLLAMA_GUIDE.md)** - 🦙 Local model management and optimization (~1,000 lines)
- **[Template Analytics](docs/TEMPLATE_ANALYTICS.md)** - 📊 Usage tracking and effectiveness scoring (~450 lines)
- **[Examples](docs/EXAMPLES.md)** - 📝 20 comprehensive v2.4.0 examples (~2,560 lines)
- **[Configuration](docs/CONFIGURATION.md)** - ⚙️ All v2.4.0 settings documented (~2,360 lines)

### ✨ v2.3.0 Feature Guides

- **[Intelligent Mode](docs/INTELLIGENT_MODE.md)** - 4-stage intelligence pipeline guide (967 lines)
- **[Platform Generation](docs/PLATFORM_GENERATION.md)** - Platform-native generation guide (840 lines)
- **[Templates](docs/TEMPLATES.md)** - Template system guide with 60+ templates (526 lines)
- **[Performance](docs/PERFORMANCE.md)** - Performance and async loading guide (391 lines)

### 🐳 Docker Guides

- **[Docker Guide](docs/DOCKER.md)** - Complete Docker documentation
- **[Docker on Windows](docs/DOCKER_WINDOWS.md)** - Windows-specific Docker setup
- **[Docker Troubleshooting](docs/DOCKER_TROUBLESHOOTING.md)** - Docker issues and solutions

### 🔧 Advanced Features

- **[Template System](docs/TEMPLATES.md)** - Command templates and patterns
- **[Advanced Paths](docs/ADVANCED_PATHS.md)** - Path handling and security
- **[Cache Reference](docs/CACHE_QUICK_REFERENCE.md)** - Caching system overview
- **[Groq Quick Start](docs/GROQ_QUICKSTART.md)** - Fast Groq LLM setup
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Command cheat sheet

### 📋 Project Documentation

- **[Security Policy](SECURITY.md)** - Security practices and vulnerability reporting
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to CLI_X
- **[Changelog](CHANGELOG.md)** - Version history and changes (see [2.3.0] for latest)
- **[Roadmap](docs/ROADMAP.md)** - Project roadmap and future plans
- **[Concept Overview](CONCEPT.md)** - Project philosophy and design
- **[Release Notes v2.3.0](docs/releases/v2.3.0/RELEASE_NOTES.md)** - Intelligence & Interactive Mode release

## 💡 Usage Examples

### Basic Usage

```bash
# Interactive mode
cargo run

# Direct query
cargo run -- --query "list all files in the current directory"

# Dry run (show command without executing)
cargo run -- --query "delete all .log files" --dry-run

# Auto-confirm execution (dangerous!)
cargo run -- --query "create a backup of my documents" --yes
```

### Available Commands

```bash
# Show configuration
cargo run -- config show

# Reset configuration to defaults
cargo run -- config reset

# Show command history
cargo run -- history

# Show last 5 commands
cargo run -- history --count 5

# Interactive mode
cargo run -- interactive
```

## Example Interactions

### File Operations

```
Query: "show me all Python files larger than 1MB"
Generated: find . -name "*.py" -size +1M -ls
Risk Level: Low
```

### System Information

```
Query: "check how much disk space is available"
Generated: df -h
Risk Level: Low
```

### Process Management

```
Query: "kill all Chrome processes"
Generated: pkill -f chrome
Risk Level: High
Warning: This command terminates running processes
```

## 🛡️ Enhanced Safety System

CLI_X features a sophisticated multi-layer safety system to protect against dangerous commands:

### Safety Layers

1. **Rule-Based Validation** - 11 comprehensive safety rules covering:
   - Root filesystem destruction (Critical)
   - Drive formatting operations (Critical)
   - Remote code execution (Critical)
   - System shutdown/reboot (High)
   - Dangerous permissions (High)
   - Database operations (High)
   - Recursive deletion (Medium)
   - Process manipulation (Medium)
   - Command injection (Medium)
   - Elevated privileges (Low)

2. **ML-Inspired Risk Scoring** - Weighted algorithm analyzing:
   - **Severity** (50%): Rule violation severity
   - **Pattern** (20%): Dangerous keywords, wildcards, chaining
   - **Context** (30%): Elevated privileges, sensitive directories

3. **Context Awareness** - Considers execution environment:
   - Working directory (detects `/etc`, `C:\Windows`, etc.)
   - Privilege level (root, administrator)
   - Disk space availability
   - Session history

4. **Impact Analysis** - Evaluates command consequences:
   - Destructiveness assessment
   - Reversibility check
   - Affected resources identification
   - Duration estimation
   - Side effect prediction

5. **Safer Alternatives** - Suggests better options:
   - `rm -rf` → `rm -ri` (interactive)
   - `chmod 777` → `chmod 755` (restrictive)
   - `curl | sh` → Review script first

### Risk Levels

- **Low (0.0-0.3)**: ✅ Safe operations (ls, pwd, df)
- **Medium (0.3-0.6)**: ⚠️  Requires confirmation (rm, chmod)
- **High (0.6-0.8)**: 🔶 Strongly discouraged (killall, DROP TABLE)
- **Critical (0.8-1.0)**: ⛔ Should be blocked (rm -rf /, format)

**See [Safety Documentation](docs/SAFETY.md) for complete details.**

## 🔌 Multi-Provider LLM Support

CLI_X supports multiple LLM providers with automatic fallback and smart provider selection:

### Supported Providers

1. **OpenAI** - GPT-4o, GPT-4o-mini
   - ✅ JSON mode support
   - ✅ Streaming responses
   - 💰 Cost: $0.15 per 1M input tokens (gpt-4o-mini)
   - 🚀 Max tokens: 128K context window

2. **Groq** - Llama 3.3 70B Versatile
   - ✅ JSON mode support
   - ✅ Streaming responses
   - 💰 Cost: Free tier available
   - 🚀 Max tokens: 32K context window
   - ⚡ Ultra-fast inference

3. **Anthropic Claude** - Claude 3.5 Sonnet (NEW!)
   - ✅ System prompts
   - ✅ Streaming responses  
   - 💰 Cost: $3 per 1M input tokens
   - 🚀 Max tokens: 200K context window
   - 🧠 Superior reasoning

4. **Local Models (Ollama)** - CodeLlama, Llama 2, Mistral (NEW!)
   - ✅ Complete privacy
   - ✅ Streaming responses
   - 💰 Cost: Free (runs locally)
   - 🏠 No API keys required
   - 📡 Configurable endpoint

### Provider Selection

```bash
# Auto mode - automatically selects best available provider
export LLM_PROVIDER="auto"  # Default: tries Groq → Anthropic → OpenAI → Local

# Specific provider
export LLM_PROVIDER="anthropic"
export ANTHROPIC_API_KEY="your-key"

# Local model
export LLM_PROVIDER="local"
export OLLAMA_ENDPOINT="http://localhost:11434"  # Optional, default shown
export OLLAMA_MODEL="codellama"  # Optional
```

### Configuration

Add provider keys to `~/.config/cli_x/config.json`:

```json
{
  "llm_provider": "auto",
  "openai_api_key": "sk-...",
  "openai_model": "gpt-4o-mini",
  "groq_api_key": "gsk_...",
  "groq_model": "llama-3.3-70b-versatile",
  "anthropic_api_key": "sk-ant-...",
  "anthropic_model": "claude-3-5-sonnet-20241022",
  "ollama_endpoint": "http://localhost:11434",
  "ollama_model": "codellama"
}
```

### Provider Capabilities

| Provider   | Streaming | JSON Mode | Cost/1M | Speed  | Context |
|-----------|-----------|-----------|---------|--------|---------|
| Groq       | ✅        | ✅        | Free    | ⚡⚡⚡   | 32K     |
| Anthropic  | ✅        | ❌        | $3.00   | ⚡⚡    | 200K    |
| OpenAI     | ✅        | ✅        | $0.15   | ⚡     | 128K    |
| Ollama     | ✅        | ❌        | Free    | ⚡     | 4K      |

**Fallback Chain**: If primary provider fails, CLI_X automatically tries the next available provider.

## Safety Features

CLI_X includes multiple safety layers:

1. **Risk Assessment**: Every command is analyzed for potential danger
2. **User Confirmation**: Dangerous commands require explicit approval
3. **Pattern Matching**: Known dangerous patterns are flagged
4. **Audit Logging**: All commands and executions are logged
5. **Dry Run Mode**: Test commands without execution

### Risk Levels

- **Low**: Safe operations (reading files, showing information)
- **Medium**: Potentially risky (moving files, changing permissions)
- **High**: Dangerous operations (deleting files, killing processes)
- **Critical**: System-threatening (formatting drives, shutdown commands)

## Development Status

This is Phase 1 of the CLI_X project. Current limitations:

- Only OpenAI API is supported (GPT-3.5-turbo/GPT-4)
- Basic safety validation (expanding in Phase 2)
- Simple command execution (interactive commands in Phase 2)
- Comprehensive cross-platform testing ongoing

## 🔮 Roadmap

### Phase 2 (Planned)
- 🎯 Enhanced safety validation with ML-based risk assessment
- 🎯 Additional LLM providers (Anthropic Claude, local models)
- 🎯 Context-aware command generation
- 🎯 Interactive command support with streaming
- 🎯 Plugin system for custom command generators
- 🎯 Multi-step command workflows
- 🎯 Command templates and favorites

### Phase 3 (Future)
- Advanced context understanding
- Shell environment integration
- Collaborative command building
- Web interface
- API service mode

## 🛠️ Architecture

```
cli_x/
├── src/
│   ├── main.rs           # Entry point and CLI orchestration
│   ├── cli/              # Command-line interface
│   ├── llm/              # LLM provider integrations
│   ├── commands/         # Command execution engine
│   ├── safety/           # Safety validation system
│   ├── system/           # Platform detection
│   ├── config.rs         # Configuration management
│   ├── error.rs          # Error handling
│   └── audit.rs          # Audit logging
├── docs/                 # Documentation
│   ├── SETUP.md         # Development setup
│   ├── DOCKER_WINDOWS.md # Windows Docker guide
│   ├── DOCKER.md        # Complete Docker docs
│   ├── EXAMPLES.md      # Usage examples
│   └── DOCKER_TROUBLESHOOTING.md
├── config/              # Configuration files
├── logs/                # Audit logs
└── Dockerfile           # Multi-stage Docker build
```

## 🐳 Docker Support

CLI_X includes comprehensive Docker support with multi-stage builds.

### Windows

```cmd
# One-command setup
docker-windows.bat quickstart

# Step by step
docker-windows.bat setup      # Create config files
docker-windows.bat setkey     # Set API key
docker-windows.bat validate   # Run tests
docker-windows.bat build dev  # Build image
docker-windows.bat dev        # Start development
```

### Linux/macOS

```bash
./docker.sh quickstart
```

**Note**: Windows script optimized for Windows 11 with timeout protection.

See [`docs/DOCKER_WINDOWS.md`](docs/DOCKER_WINDOWS.md) for complete Windows Docker guide.

## 🔧 Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**

   - Set the `OPENAI_API_KEY` environment variable
   - Or edit the config file to add your API key

2. **"Command execution failed"**

   - Check if the generated command is valid for your platform
   - Try running in dry-run mode first: `--dry-run`

3. **Permission errors**
   - Some commands may require elevated privileges
   - On Windows: Run as Administrator
   - On Unix: Use `sudo` when needed

### Debugging

Enable verbose logging:

```bash
RUST_LOG=debug cargo run -- --query "your query here" --verbose
```

## 📚 Documentation

Comprehensive guides are available in the `docs/` directory:

- **[PLATFORM_SUPPORT.md](docs/PLATFORM_SUPPORT.md)** - Cross-platform command generation guide
  - Platform detection and support matrix
  - PowerShell and Bash generator documentation
  - Command equivalence mapping
  - LLM integration helpers
  - API reference and examples

- **[SETUP.md](docs/SETUP.md)** - Development environment setup
- **[DOCKER_WINDOWS.md](docs/DOCKER_WINDOWS.md)** - Windows Docker setup guide
- **[DOCKER.md](docs/DOCKER.md)** - Complete Docker documentation
- **[EXAMPLES.md](docs/EXAMPLES.md)** - Usage examples and scenarios
- **[SAFETY.md](docs/SAFETY.md)** - Safety system documentation
- **[MULTI_PROVIDER.md](docs/MULTI_PROVIDER.md)** - LLM provider configuration

## Contributing

This is a proprietary project. Contributions are currently not accepted from external contributors.

For bug reports and feature requests, please open an issue on GitHub.

## License

Copyright © 2025 CLI_X Team. All Rights Reserved.

This is proprietary software. Unauthorized copying, distribution, modification, or use of this software is strictly prohibited.
