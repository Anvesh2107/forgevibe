package com.forgevibe.aiworker.config;

import com.forgevibe.aiworker.event.ProjectSubmittedEvent;
import com.forgevibe.aiworker.event.ThoughtSubmittedEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    // ── Producer ────────────────────────────────────────────────────────────────
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

    // ── Consumer: ThoughtSubmittedEvent ─────────────────────────────────────────
    @Bean
    public ConsumerFactory<String, ThoughtSubmittedEvent> thoughtSubmittedConsumerFactory() {
        JsonDeserializer<ThoughtSubmittedEvent> deser = new JsonDeserializer<>(ThoughtSubmittedEvent.class, false);
        deser.addTrustedPackages("*");
        Map<String, Object> props = baseConsumerProps();
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), deser);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ThoughtSubmittedEvent> thoughtSubmittedListenerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, ThoughtSubmittedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(thoughtSubmittedConsumerFactory());
        return factory;
    }

    // ── Consumer: ProjectSubmittedEvent ─────────────────────────────────────────
    @Bean
    public ConsumerFactory<String, ProjectSubmittedEvent> projectSubmittedConsumerFactory() {
        JsonDeserializer<ProjectSubmittedEvent> deser = new JsonDeserializer<>(ProjectSubmittedEvent.class, false);
        deser.addTrustedPackages("*");
        Map<String, Object> props = baseConsumerProps();
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), deser);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ProjectSubmittedEvent> projectSubmittedListenerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, ProjectSubmittedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(projectSubmittedConsumerFactory());
        return factory;
    }

    private Map<String, Object> baseConsumerProps() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "forgevibe-ai-worker");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        return props;
    }
}
