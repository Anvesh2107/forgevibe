package com.forgevibe.config;

import com.forgevibe.event.*;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.*;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    // ── Topics ─────────────────────────────────────────────────────────────────
    @Bean public NewTopic thoughtSubmittedTopic()  { return TopicBuilder.name("thought.submitted").partitions(3).replicas(1).build(); }
    @Bean public NewTopic thoughtReviewedTopic()   { return TopicBuilder.name("thought.reviewed").partitions(3).replicas(1).build(); }
    @Bean public NewTopic projectSubmittedTopic()  { return TopicBuilder.name("project.submitted").partitions(3).replicas(1).build(); }
    @Bean public NewTopic projectAnalyzedTopic()   { return TopicBuilder.name("project.analyzed").partitions(3).replicas(1).build(); }
    @Bean public NewTopic reportFiledTopic()       { return TopicBuilder.name("report.filed").partitions(3).replicas(1).build(); }

    // ── Producer ───────────────────────────────────────────────────────────────
    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        props.put(JsonSerializer.ADD_TYPE_INFO_HEADERS, false);
        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    // ── Consumer: ThoughtReviewedEvent ─────────────────────────────────────────
    @Bean
    public ConsumerFactory<String, ThoughtReviewedEvent> thoughtReviewedConsumerFactory() {
        JsonDeserializer<ThoughtReviewedEvent> deser = new JsonDeserializer<>(ThoughtReviewedEvent.class, false);
        deser.addTrustedPackages("*");
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "forgevibe-backend");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, deser.getClass());
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), deser);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ThoughtReviewedEvent> thoughtReviewedListenerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, ThoughtReviewedEvent> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(thoughtReviewedConsumerFactory());
        return factory;
    }

    // ── Consumer: ProjectAnalyzedEvent ─────────────────────────────────────────
    @Bean
    public ConsumerFactory<String, ProjectAnalyzedEvent> projectAnalyzedConsumerFactory() {
        JsonDeserializer<ProjectAnalyzedEvent> deser = new JsonDeserializer<>(ProjectAnalyzedEvent.class, false);
        deser.addTrustedPackages("*");
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "forgevibe-backend");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, deser.getClass());
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), deser);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ProjectAnalyzedEvent> projectAnalyzedListenerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, ProjectAnalyzedEvent> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(projectAnalyzedConsumerFactory());
        return factory;
    }
}
