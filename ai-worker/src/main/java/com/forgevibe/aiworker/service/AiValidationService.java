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
            String status
    ) {}

    // ── Thought validation ───────────────────────────────────────────────────────
    public ValidationResult validateThought(String content) {
        if (openAiKey != null && !openAiKey.isBlank()) {
            return validateThoughtWithOpenAi(content);
        }
        return mockValidateThought(content);
    }

    // ── Project deep analysis ────────────────────────────────────────────────────
    public ProjectAnalysisResult analyzeProject(String title, String description, String stack) {
        String combined = title + " " + description + " " + (stack != null ? stack : "");
        if (openAiKey != null && !openAiKey.isBlank()) {
            return analyzeProjectWithOpenAi(title, description, stack);
        }
        return mockAnalyzeProject(combined);
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

        return new ProjectAnalysisResult(arch, sec, qual, docs, summary, vibeCheck,
                strengths, improvements, overall, status);
    }

    private int clamp(int v) { return Math.max(20, Math.min(98, v)); }

    // ── OpenAI thought validation ────────────────────────────────────────────────
    private ValidationResult validateThoughtWithOpenAi(String content) {
        try {
            String systemPrompt = """
                You are a content moderation AI for ForgeVibe, a platform for software builders and tech enthusiasts.
                Evaluate whether the submitted post belongs on a tech community feed.

                APPROVE (score 65-100) if the post is:
                - A technical insight, opinion, or take on software engineering, AI, or developer tools
                - A discussion question about tech trends, architecture, or engineering tradeoffs
                - A builder update, project launch, or dev experience story
                - Commentary on AI tools, LLMs, agentic systems, or the future of software

                NEEDS CONTEXT (score 35-64) if the post is tech-adjacent but vague or lacks substance.

                BLOCK (score 0-34) only for clear spam, NSFW content, or completely off-topic posts.

                Respond with ONLY a JSON object:
                {"confidence": <0-100>, "reason": "<short explanation>"}
                """;
            String response = callOpenAi(systemPrompt, "Evaluate this post:\n" + content, 150);
            JsonNode result = parseJsonFromResponse(response);
            int confidence = result.path("confidence").asInt(65);
            String reason = result.path("reason").asText("No reason provided.");
            String status = confidence >= 65 ? "published" : confidence >= 35 ? "needs_context" : "blocked";
            return new ValidationResult(confidence, status, reason);
        } catch (Exception e) {
            log.error("[OpenAI] Thought validation failed, falling back to mock: {}", e.getMessage());
            return mockValidateThought(content);
        }
    }

    // ── OpenAI project analysis ──────────────────────────────────────────────────
    private ProjectAnalysisResult analyzeProjectWithOpenAi(String title, String description, String stack) {
        try {
            String systemPrompt = """
                You are a senior software engineer performing a repository analysis for ForgeVibe.
                Given a project title, description, and tech stack, produce scores and narrative.
                Respond with ONLY a JSON object (no markdown):
                {
                  "architectureScore": <0-100>,
                  "securityScore": <0-100>,
                  "qualityScore": <0-100>,
                  "docsScore": <0-100>,
                  "summary": "<2-3 sentence objective summary>",
                  "vibeCheck": "<1 punchy sentence about the project vibe>",
                  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
                  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
                }
                Base scores on what can be inferred from the description. Be fair and constructive.
                """;
            String userMsg = "Title: " + title + "\nDescription: " + description
                    + "\nStack: " + (stack != null ? stack : "not specified");
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

            return new ProjectAnalysisResult(
                    arch, sec, qual, docs,
                    r.path("summary").asText(""),
                    r.path("vibeCheck").asText(""),
                    strengthsJson, improvementsJson,
                    overall, status);
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
