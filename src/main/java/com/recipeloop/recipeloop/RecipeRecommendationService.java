package com.recipeloop.recipeloop;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class RecipeRecommendationService {

    private static final Pattern TOKEN_PATTERN =
            Pattern.compile("[a-z0-9]+");

    private static final Set<String> STOP_WORDS = Set.of(
            "a", "an", "and", "are", "as", "at", "be", "by",
            "for", "from", "in", "into", "is", "it", "of", "on",
            "or", "the", "this", "to", "with", "your",
            "add", "after", "before", "cook", "cut", "mix",
            "place", "put", "serve", "stir", "then", "until",
            "use", "using", "well"
    );

    private final RecipeRepository recipeRepository;

    public RecipeRecommendationService(RecipeRepository recipeRepository) {
        this.recipeRepository = recipeRepository;
    }

    public List<RecipeRecommendationResponse> getRecommendations(
            Long recipeId, int requestedLimit) {

        Recipe target = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new RecipeNotFoundException(recipeId));

        int limit = Math.max(1, Math.min(requestedLimit, 10));
        List<Recipe> allRecipes = recipeRepository.findAll();

        if (allRecipes.size() < 2) {
            return List.of();
        }

        List<List<String>> documents = allRecipes.stream()
                .map(this::getDocumentTokens)
                .toList();

        Map<String, Double> inverseDocumentFrequency =
                calculateInverseDocumentFrequency(documents);

        Map<String, Double> targetVector = null;

        for (int i = 0; i < allRecipes.size(); i++) {
            if (allRecipes.get(i).getId().equals(target.getId())) {
                targetVector = createTfidfVector(
                        documents.get(i), inverseDocumentFrequency);
                break;
            }
        }

        if (targetVector == null) {
            return List.of();
        }

        Map<String, Double> finalTargetVector = targetVector;

        return java.util.stream.IntStream.range(0, allRecipes.size())
                .filter(i -> !allRecipes.get(i).getId().equals(target.getId()))
                .mapToObj(i -> {
                    Recipe candidate = allRecipes.get(i);
                    Map<String, Double> candidateVector =
                            createTfidfVector(
                                    documents.get(i), inverseDocumentFrequency);

                    double score = cosineSimilarity(
                            finalTargetVector, candidateVector);

                    return new RecipeRecommendationResponse(
                            candidate.getId(),
                            candidate.getName(),
                            candidate.getDescription(),
                            candidate.getIngredients(),
                            candidate.getPrepTimeMinutes(),
                            candidate.getServings(),
                            score
                    );
                })
                .sorted(
                        Comparator.comparingDouble(
                                        RecipeRecommendationResponse::similarityScore)
                                .reversed()
                                .thenComparing(
                                        RecipeRecommendationResponse::name,
                                        String.CASE_INSENSITIVE_ORDER)
                )
                .limit(limit)
                .collect(Collectors.toList());
    }

    private List<String> getDocumentTokens(Recipe recipe) {
        String document = String.join(" ",
                safe(recipe.getName()),
                safe(recipe.getDescription()),
                safe(recipe.getIngredients()));

        Matcher matcher = TOKEN_PATTERN.matcher(
                document.toLowerCase(Locale.ROOT));

        List<String> tokens = new ArrayList<>();

        while (matcher.find()) {
            String token = matcher.group();

            if (!STOP_WORDS.contains(token) && token.length() > 1) {
                tokens.add(token);
            }
        }

        return tokens;
    }

    private Map<String, Double> calculateInverseDocumentFrequency(
            List<List<String>> documents) {

        Map<String, Integer> documentFrequency = new HashMap<>();

        for (List<String> document : documents) {
            Set<String> uniqueTerms = new HashSet<>(document);

            for (String term : uniqueTerms) {
                documentFrequency.merge(term, 1, Integer::sum);
            }
        }

        Map<String, Double> idf = new HashMap<>();
        int totalDocuments = documents.size();

        documentFrequency.forEach((term, frequency) ->
                idf.put(term,
                        Math.log((totalDocuments + 1.0) /
                                (frequency + 1.0)) + 1.0));

        return idf;
    }

    private Map<String, Double> createTfidfVector(
            List<String> tokens,
            Map<String, Double> inverseDocumentFrequency) {

        Map<String, Integer> termCounts = new HashMap<>();

        for (String token : tokens) {
            termCounts.merge(token, 1, Integer::sum);
        }

        Map<String, Double> vector = new HashMap<>();

        if (tokens.isEmpty()) {
            return vector;
        }

        termCounts.forEach((term, count) -> {
            double termFrequency = count / (double) tokens.size();
            double idf = inverseDocumentFrequency.getOrDefault(term, 1.0);
            vector.put(term, termFrequency * idf);
        });

        return vector;
    }

    private double cosineSimilarity(
            Map<String, Double> first,
            Map<String, Double> second) {

        if (first.isEmpty() || second.isEmpty()) {
            return 0.0;
        }

        double dotProduct = 0.0;
        double firstMagnitude = 0.0;
        double secondMagnitude = 0.0;

        for (Map.Entry<String, Double> entry : first.entrySet()) {
            double firstValue = entry.getValue();
            firstMagnitude += firstValue * firstValue;

            double secondValue = second.getOrDefault(entry.getKey(), 0.0);
            dotProduct += firstValue * secondValue;
        }

        for (double value : second.values()) {
            secondMagnitude += value * value;
        }

        if (firstMagnitude == 0.0 || secondMagnitude == 0.0) {
            return 0.0;
        }

        return dotProduct /
                (Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude));
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}