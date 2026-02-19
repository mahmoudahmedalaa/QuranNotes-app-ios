/**
 * TopicGrid — 2-column grid of TopicCards with staggered entrance animations.
 */
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { QURAN_TOPICS, QuranTopic } from '../../../domain/entities/QuranTopics';
import { TopicCard } from './TopicCard';
import { Spacing } from '../../theme/DesignSystem';

interface TopicGridProps {
    onTopicPress: (topic: QuranTopic) => void;
    topics?: QuranTopic[];
}

export const TopicGrid: React.FC<TopicGridProps> = ({ onTopicPress, topics }) => {
    const data = topics || QURAN_TOPICS;

    return (
        <FlatList
            data={data}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
                <TopicCard
                    topic={item}
                    index={index}
                    onPress={onTopicPress}
                />
            )}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.xs,
        paddingBottom: Spacing.xxl,
    },
});
