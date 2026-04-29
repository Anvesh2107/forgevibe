package com.forgevibe.aiworker.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;

@Service
@Slf4j
public class AiValidationService {

    @Value("${ai.openai.api-key:}")
    private String openAiKey;

    @Value("${ai.openai.model:gpt-4o-mini}")
    private String model;

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://api.openai.com")
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    private static final List<String> TECH_KEYWORDS = List.of(
            // Languages & runtimes
            "code", "software", "programming", "developer", "engineer",
            "java", "python", "javascript", "typescript", "rust", "go", "golang",
            "kotlin", "swift", "c++", "c#", "ruby", "php", "scala", "elixir",
            // Frameworks & libraries
            "react", "vue", "angular", "spring", "django", "flask", "fastapi",
            "next.js", "nestjs", "express", "rails", "laravel", "framework", "library",
            // AI / ML — modern terms (expanded)
            "rag", "llm", "embedding", "vector", "retrieval", "inference", "neural",
            "transformer", "gpt", "bert", "token", "prompt", "fine-tun", "training",
            "model", "machine learning", "deep learning", "ai", "langchain", "semantic",
            "generative", "chatbot", "agent", "agentic", "diffusion", "mlops", "hugging face",
            "copilot", "autopilot", "autonomous", "agi", "reasoning", "multi-agent",
            "orchestrat", "workflow automation", "vibe cod", "cursor", "windsurf",
            "claude", "openai", "gemini", "mistral", "anthropic", "o1", "o3",
            // Data & pipelines
            "pipeline", "data pipeline", "etl", "data lake", "data warehouse",
            "ingestion", "stream", "event-driven", "kafka", "flink", "spark",
            "analytics", "sql", "nosql", "database", "postgresql", "mongodb", "redis",
            // Infrastructure & cloud
            "docker", "kubernetes", "cloud", "aws", "gcp", "azure", "terraform",
            "microservice", "serverless", "devops", "ci/cd", "deploy", "container",
            "linux", "nginx", "load balancer", "observability", "monitoring",
            // Architecture & patterns
            "architecture", "distributed", "scalable", "latency", "throughput",
            "api", "rest", "graphql", "grpc", "websocket", "event sourcing", "cqrs",
            "saga", "circuit breaker", "rate limit", "cache", "message queue",
            // Web & frontend
            "frontend", "backend", "fullstack", "web", "browser", "dom", "css",
            "performance", "accessibility", "seo", "pwa",
            // Security
            "security", "auth", "oauth", "jwt", "encryption", "vulnerability", "pen test",
            // General engineering
            "open source", "git", "algorithm", "data structure", "complexity",
            "refactor", "test", "unit test", "integration", "readme", "docs",
            "documentation", "startup", "saas", "platform", "mvp", "build", "launch",
            "project", "tool", "hack", "product", "app",
            // Builder / opinion / discussion signals
            "productivity", "engineering", "technic", "automation", "autonomy",
            "builder", "ship", "debugging", "deploy", "system design", "tech debt",
            "feature flag", "rollout", "migration", "abstraction", "tradeoff"
    );

    private static final List<String> SPAM_KEYWORDS = List.of(
            "buy now", "click here", "free money", "make money fast", "casino",
            "adult", "xxx", "viagra", "lottery", "winner", "congratulations you"
    );

    public record ValidationResult(int confidence, String status, String reason) {}

    public record ProjectAnalysisResult(
            int architectureScore,
            int securityScore,
            int qualityScore,
            int docsScore,
            String summary,
            String vibeCheck,
            String strengths,    // JSON array string
            String improvements, // JSON array string
            int confidence,
            String status,
            List<String> detectedTags
    ) {}

    // ── Thought validation ───────────────────────────────────────────────────────
    public ValidationResult validateThought(String content) {
        if (openAiKey != null && !openAiKey.isBlank()) {
            return validateThoughtWithOpenAi(content);
        }
        return mockValidateThought(content);
    }

    // ── Project deep analysis ────────────────────────────────────────────────────
    public ProjectAnalysisResult analyzeProject(String title, String description, String stack, String repoUrl) {
        String githubContext = fetchGithubContext(repoUrl);
        String combined = title + " " + description + " " + (stack != null ? stack : "");
        if (openAiKey != null && !openAiKey.isBlank()) {
            return analyzeProjectWithOpenAi(title, description, stack, githubContext);
        }
        return mockAnalyzeProject(combined + " " + githubContext);
    }

    // ── Fetch GitHub repo info + README ──────────────────────────────────────────
    private String fetchGithubContext(String repoUrl) {
        if (repoUrl == null || !repoUrl.contains("github.com")) return "";
        try {
            // Extract owner/repo from URL (handles trailing .git or slashes)
            String path = repoUrl.replaceFirst("https?://github\\.com/", "").replaceAll("\\.git$", "").replaceAll("/$", "");
            String apiBase = "https://api.github.com/repos/" + path;

            String repoJson = WebClient.builder().build()
                    .get().uri(apiBase)
                    .header("Accept", "application/vnd.github+json")
                    .retrieve().bodyToMono(String.class)
                    .onErrorReturn("{}").block();

            JsonNode repo = mapper.readTree(repoJson != null ? repoJson : "{}");
            String ghDesc = repo.path("description").asText("");
            String language = repo.path("language").asText("");
            int stars = repo.path("stargazers_count").asInt(0);
            int forks = repo.path("forks_count").asInt(0);
            String topics = repo.path("topics").toString();

            // Fetch README (base64-encoded)
            String readmeJson = WebClient.builder().build()
                    .get().uri(apiBase + "/readme")
                    .header("Accept", "application/vnd.github+json")
                    .retrieve().bodyToMono(String.class)
                    .onErrorReturn("{}").block();

            String readmeText = "";
            JsonNode readmeNode = mapper.readTree(readmeJson != null ? readmeJson : "{}");
            String encoded = readmeNode.path("content").asText("");
            if (!encoded.isBlank()) {
                byte[] decoded = java.util.Base64.getMimeDecoder().decode(encoded);
                readmeText = new String(decoded).substring(0, Math.min(3000, new String(decoded).length()));
            }

            return String.format(
                "GitHub: description=%s, language=%s, stars=%d, forks=%d, topics=%s\nREADME:\n%s",
                ghDesc, language, stars, forks, topics, readmeText);
        } catch (Exception e) {
            log.warn("[GitHub] Failed to fetch repo context for {}: {}", repoUrl, e.getMessage());
            return "";
        }
    }

    // ── Mock thought scoring ─────────────────────────────────────────────────────
    private ValidationResult mockValidateThought(String content) {
        String lower = content.toLowerCase();
        for (String spam : SPAM_KEYWORDS) {
            if (lower.contains(spam)) {
                return new ValidationResult(20, "blocked",
                        "Content appears to be spam or promotional material.");
            }
        }
        if (content.trim().split("\\s+").length < 5) {
            return new ValidationResult(40, "blocked",
                    "Post is too short to be meaningful. Add more context.");
        }
        long techHits = TECH_KEYWORDS.stream().filter(lower::contains).count();
        // 1 keyword hit → ~65, 2 hits → ~72, 3+ → 80+
        int base = (int) Math.min(95, 55 + techHits * 8);
        int confidence = Math.max(0, Math.min(100, base + new Random().nextInt(7) - 3));
        // Publish at 60+ to allow discussion/opinion posts about tech topics
        String status = confidence >= 60 ? "published" : confidence >= 35 ? "needs_context" : "blocked";
        String reason = confidence >= 75
                ? "Solid tech content — great take for the community."
                : confidence >= 60
                ? "Tech-relevant post. Approved for the feed."
                : confidence >= 35
                ? "Partially relevant — add more technical context."
                : "Content doesn't appear to be tech-related.";
        return new ValidationResult(confidence, status, reason);
    }

    // ── Mock project analysis ────────────────────────────────────────────────────
    private ProjectAnalysisResult mockAnalyzeProject(String combined) {
        String lower = combined.toLowerCase();
        long techHits = TECH_KEYWORDS.stream().filter(lower::contains).count();
        Random rng = new Random(combined.hashCode());

        int base = (int) Math.min(90, 45 + techHits * 6);
        int arch  = clamp(base + rng.nextInt(21) - 10);
        int sec   = clamp(base + rng.nextInt(21) - 10);
        int qual  = clamp(base + rng.nextInt(21) - 10);
        int docs  = clamp(base + rng.nextInt(21) - 10);
        int overall = (arch + sec + qual + docs) / 4;

        String status = overall >= 80 ? "published" : overall >= 50 ? "needs_context" : "blocked";
        String summary = "This project demonstrates " + (overall >= 70 ? "solid" : "developing")
                + " engineering fundamentals with " + techHits + " tech-relevant signals detected.";
        String vibeCheck = overall >= 80 ? "Strong builder energy. This looks production-ready."
                : overall >= 60 ? "Good foundations, some areas to polish."
                : "Early-stage project — keep building!";

        String strengths = "[\"Clear project scope\",\"Uses modern tech stack\",\"Active development\"]";
        String improvements = "[\"Add more documentation\",\"Consider adding tests\",\"Improve README setup guide\"]";

        List<String> detectedTags = detectTagsFromContent(combined);

        return new ProjectAnalysisResult(arch, sec, qual, docs, summary, vibeCheck,
                strengths, improvements, overall, status, detectedTags);
    }

    private int clamp(int v) { return Math.max(20, Math.min(98, v)); }

    // ── Tag detection from combined text ────────────────────────────────────────
    List<String> detectTagsFromContent(String combined) {
        String lower = combined.toLowerCase();
        List<String> tags = new ArrayList<>();

        if (containsAny(lower, "java", "spring")) tags.add("Java");
        if (containsAny(lower, "python", "django", "flask", "fastapi")) tags.add("Python");
        if (containsAny(lower, "javascript", " js ")) tags.add("JavaScript");
        if (containsAny(lower, "typescript")) tags.add("TypeScript");
        if (containsAny(lower, "react", "next.js", "nextjs")) tags.add("React");
        if (containsAny(lower, "spring boot", "springboot", "spring-boot")) tags.add("Spring Boot");
        if (containsAny(lower, "node.js", "nodejs", "express", "nestjs")) tags.add("Node.js");
        if (containsAny(lower, "machine learning", "deep learning", " ai ", "llm", "neural",
                "tensorflow", "pytorch", "langchain")) tags.add("AI/ML");
        if (containsAny(lower, "devops", "docker", "kubernetes", "ci/cd", "jenkins",
                "ansible", "terraform")) tags.add("DevOps");
        if (containsAny(lower, "security", "oauth", "jwt", "encryption",
                "vulnerability", "penetration")) tags.add("Security");
        if (containsAny(lower, "open source", "opensource")) tags.add("Open Source");
        if (containsAny(lower, "mobile", "android", "ios", "flutter", "react native")) tags.add("Mobile");
        if (containsAny(lower, "web3", "blockchain", "ethereum", "solidity", "nft", "crypto")) tags.add("Web3");
        if (containsAny(lower, "data engineering", "etl", "data pipeline", "spark", "flink",
                "data lake", "data warehouse")) tags.add("Data Engineering");
        if (containsAny(lower, "infrastructure", "aws", "gcp", "azure", "cloud",
                "linux", "nginx", "load balance")) tags.add("Infrastructure");

        return tags;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    private List<String> parseDetectedTags(JsonNode r, String title, String description, String stack) {
        try {
            JsonNode tagsNode = r.path("detectedTags");
            if (!tagsNode.isMissingNode() && tagsNode.isArray()) {
                List<String> tags = new ArrayList<>();
                for (JsonNode t : tagsNode) {
                    tags.add(t.asText());
                }
                return tags;
            }
        } catch (Exception te) {
            log.warn("[OpenAI] Failed to parse detectedTags, falling back to content detection: {}", te.getMessage());
        }
        return detectTagsFromContent(title + " " + description + " " + (stack != null ? stack : ""));
    }

    // ── OpenAI thought validation ────────────────────────────────────────────────
    private ValidationResult validateThoughtWithOpenAi(String content) {
        try {
            String systemPrompt = """
                You are a content moderation AI for ForgeVibe, a platform for software builders and tech enthusiasts.
                Evaluate whether the submitted post belongs on a tech community feed.

                APPROVE (score 55-100) if the post is:
                - A technical insight, opinion, or take on software engineering, AI, or developer tools
                - A discussion question about tech trends, architecture, or engineering tradeoffs
                - A builder update, project launch, or dev experience story
                - Commentary on AI tools, LLMs, agentic systems, or the future of software
                - A question, hot take, or casual observation from a developer or builder
                - Someone sharing a link, resource, or project they built or found useful
                - Even loosely tech-related posts from the builder community are welcome

                NEEDS CONTEXT (score 35-54) if the post is very vague with no tech signal at all.

                BLOCK (score 0-34) only for clear spam, NSFW content, or completely off-topic posts (no tech connection whatsoever).

                Respond with ONLY a JSON object:
                {"confidence": <0-100>, "reason": "<short explanation>"}
                """;
            String response = callOpenAi(systemPrompt, "Evaluate this post:\n" + content, 150);
            JsonNode result = parseJsonFromResponse(response);
            int confidence = result.path("confidence").asInt(65);
            String reason = result.path("reason").asText("No reason provided.");
            String status = confidence >= 55 ? "published" : confidence >= 35 ? "needs_context" : "blocked";
            return new ValidationResult(confidence, status, reason);
        } catch (Exception e) {
            log.error("[OpenAI] Thought validation failed, falling back to mock: {}", e.getMessage());
            return mockValidateThought(content);
        }
    }

    // ── OpenAI project analysis ──────────────────────────────────────────────────
    private ProjectAnalysisResult analyzeProjectWithOpenAi(String title, String description, String stack, String githubContext) {
        try {
            String systemPrompt = """
                You are a senior software engineer performing a repository analysis for ForgeVibe.
                Given a project's metadata and GitHub README (when available), produce scores and narrative.
                Respond with ONLY a JSON object (no markdown):
                {
                  "architectureScore": <0-100>,
                  "securityScore": <0-100>,
                  "qualityScore": <0-100>,
                  "docsScore": <0-100>,
                  "summary": "<2-3 sentence objective summary of what the project does and its technical approach>",
                  "vibeCheck": "<1 punchy sentence capturing the builder energy and project vibe>",
                  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
                  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
                  "detectedTags": ["<pick from: Java, Python, JavaScript, TypeScript, React, Spring Boot, Node.js, AI/ML, DevOps, Security, Open Source, Mobile, Web3, Data Engineering, Infrastructure — only include what clearly applies>"]
                }
                Use the README and GitHub metadata to produce accurate, specific analysis. Be fair and constructive.
                """;
            String userMsg = "Title: " + title + "\nDescription: " + description
                    + "\nStack: " + (stack != null ? stack : "not specified")
                    + (githubContext != null && !githubContext.isBlank() ? "\n\n" + githubContext : "");
            String response = callOpenAi(systemPrompt, userMsg, 600);
            JsonNode r = parseJsonFromResponse(response);

            int arch  = r.path("architectureScore").asInt(60);
            int sec   = r.path("securityScore").asInt(60);
            int qual  = r.path("qualityScore").asInt(60);
            int docs  = r.path("docsScore").asInt(60);
            int overall = (arch + sec + qual + docs) / 4;
            String status = overall >= 80 ? "published" : overall >= 50 ? "needs_context" : "blocked";

            // Serialize strengths/improvements arrays back to JSON strings
            String strengthsJson = mapper.writeValueAsString(r.path("strengths"));
            String improvementsJson = mapper.writeValueAsString(r.path("improvements"));

            // Parse detectedTags from AI response, fall back to content-based detection on failure
            final List<String> detectedTags = parseDetectedTags(r, title, description, stack);

            return new ProjectAnalysisResult(
                    arch, sec, qual, docs,
                    r.path("summary").asText(""),
                    r.path("vibeCheck").asText(""),
                    strengthsJson, improvementsJson,
                    overall, status, detectedTags);
        } catch (Exception e) {
            log.error("[OpenAI] Project analysis failed, falling back to mock: {}", e.getMessage());
            return mockAnalyzeProject(title + " " + description + " " + stack);
        }
    }

    // ── Shared OpenAI HTTP helper ────────────────────────────────────────────────
    private String callOpenAi(String systemPrompt, String userMsg, int maxTokens) {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMsg)
                ),
                "max_tokens", maxTokens
        );
        return webClient.post()
                .uri("/v1/chat/completions")
                .header("Authorization", "Bearer " + openAiKey)
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    private JsonNode parseJsonFromResponse(String response) throws Exception {
        JsonNode root = mapper.readTree(response);
        String content = root.path("choices").get(0).path("message").path("content").asText();
        content = content.replaceAll("```json|```", "").trim();
        return mapper.readTree(content);
    }
}
