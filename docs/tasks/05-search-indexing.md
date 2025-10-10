# Search & Indexing Tasks

## Overview
This checklist covers implementing full-text search capabilities using Elasticsearch and the Searcher service for real-time indexing.

---

## ✅ Task Checklist

### 1. Elasticsearch Setup & Configuration
**Goal**: Elasticsearch cluster ready for search operations

- [ ] Verify Elasticsearch cluster is running
- [ ] Configure cluster settings (shards, replicas)
- [ ] Create index templates
- [ ] Define mappings for searchable entities
- [ ] Set up analyzers and tokenizers
- [ ] Configure index settings (refresh interval, etc.)
- [ ] Set up index aliases
- [ ] Configure snapshot and restore

**Reference Documentation**:
- [`architecture/EVENT_DRIVEN_ARCHITECTURE.md`](../architecture/EVENT_DRIVEN_ARCHITECTURE.md)

**Actions**:
```bash
# Check cluster health
curl http://localhost:9200/_cluster/health?pretty

# Create index template
curl -X PUT "http://localhost:9200/_index_template/searchable_entities" \
  -H 'Content-Type: application/json' \
  -d '{
    "index_patterns": ["users-*", "posts-*", "courses-*"],
    "template": {
      "settings": {
        "number_of_shards": 2,
        "number_of_replicas": 1,
        "analysis": {
          "analyzer": {
            "custom_analyzer": {
              "type": "custom",
              "tokenizer": "standard",
              "filter": ["lowercase", "stop", "snowball"]
            }
          }
        }
      },
      "mappings": {
        "properties": {
          "id": { "type": "keyword" },
          "title": { 
            "type": "text",
            "analyzer": "custom_analyzer"
          },
          "description": { "type": "text" },
          "createdAt": { "type": "date" },
          "tags": { "type": "keyword" }
        }
      }
    }
  }'
```

**Success Criteria**:
- ✅ Cluster status green
- ✅ Index templates created
- ✅ Mappings defined correctly
- ✅ Analyzers configured
- ✅ Index settings optimized
- ✅ Aliases set up
- ✅ Snapshot policy configured

---

### 2. Searcher Service Implementation
**Goal**: Real-time indexing from Kafka to Elasticsearch

- [ ] Set up Kafka consumer for search events
- [ ] Implement event-to-document transformation
- [ ] Handle different entity types (users, posts, courses, etc.)
- [ ] Implement bulk indexing for performance
- [ ] Add error handling and retry logic
- [ ] Implement document updates and deletes
- [ ] Add monitoring and metrics
- [ ] Set up consumer lag monitoring

**Reference Documentation**:
- [`../apps/searcher/`](../../apps/searcher/)
- [`../apps/searcher/REQUEST_TRACKING.md`](../../apps/searcher/REQUEST_TRACKING.md)

**Actions**:
```typescript
// Kafka consumer for indexing
@EventPattern('entity.created')
async handleEntityCreated(data: EntityCreatedEvent) {
  const document = this.transformToDocument(data);
  
  await this.elasticsearchService.index({
    index: `${data.entityType.toLowerCase()}-index`,
    id: data.entityId,
    document,
  });
  
  this.metrics.recordIndexed(data.entityType);
}

// Bulk indexing
@EventPattern('bulk.index')
async handleBulkIndex(data: BulkIndexEvent) {
  const operations = data.entities.flatMap(entity => [
    { index: { _index: entity.index, _id: entity.id } },
    entity.document,
  ]);
  
  const result = await this.elasticsearchService.bulk({
    operations,
    refresh: true,
  });
  
  this.logger.log(`Bulk indexed ${result.items.length} documents`);
}

// Handle updates
@EventPattern('entity.updated')
async handleEntityUpdated(data: EntityUpdatedEvent) {
  await this.elasticsearchService.update({
    index: data.index,
    id: data.entityId,
    doc: data.changes,
  });
}

// Handle deletes
@EventPattern('entity.deleted')
async handleEntityDeleted(data: EntityDeletedEvent) {
  await this.elasticsearchService.delete({
    index: data.index,
    id: data.entityId,
  });
}
```

**Success Criteria**:
- ✅ Searcher service running
- ✅ Consuming from Kafka topics
- ✅ Documents indexed in real-time
- ✅ Bulk operations working
- ✅ Updates and deletes handled
- ✅ Error handling robust
- ✅ Metrics being collected
- ✅ No consumer lag

---

### 3. Search API Implementation
**Goal**: Expose search functionality via GraphQL/REST

- [ ] Implement search resolvers/controllers
- [ ] Add full-text search queries
- [ ] Implement filters and facets
- [ ] Add sorting and pagination
- [ ] Implement autocomplete/suggestions
- [ ] Add highlighting for search results
- [ ] Implement aggregations
- [ ] Add search analytics tracking

**Actions**:
```typescript
// GraphQL search resolver
@Resolver()
export class SearchResolver {
  @Query(() => SearchResults)
  async search(
    @Args('query') query: string,
    @Args('filters', { nullable: true }) filters?: SearchFilters,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<SearchResults> {
    const searchParams = {
      index: 'users-*,posts-*,courses-*',
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['title^3', 'description^2', 'content'],
                  type: 'best_fields',
                  fuzziness: 'AUTO',
                }
              }
            ],
            filter: this.buildFilters(filters),
          }
        },
        highlight: {
          fields: {
            title: {},
            description: {},
          }
        },
        from: pagination?.offset || 0,
        size: pagination?.limit || 20,
        sort: this.buildSort(filters?.sortBy),
      }
    };
    
    const result = await this.elasticsearchService.search(searchParams);
    
    return {
      total: result.hits.total.value,
      hits: result.hits.hits.map(hit => ({
        ...hit._source,
        score: hit._score,
        highlights: hit.highlight,
      })),
    };
  }
  
  @Query(() => [String])
  async autocomplete(
    @Args('query') query: string,
    @Args('field') field: string,
  ): Promise<string[]> {
    const result = await this.elasticsearchService.search({
      index: '_all',
      body: {
        suggest: {
          suggestions: {
            prefix: query,
            completion: {
              field: `${field}.completion`,
              size: 10,
              fuzzy: { fuzziness: 'AUTO' },
            }
          }
        }
      }
    });
    
    return result.suggest.suggestions[0].options.map(opt => opt.text);
  }
}
```

**Success Criteria**:
- ✅ Search endpoints implemented
- ✅ Full-text search working
- ✅ Filters and facets functional
- ✅ Pagination working
- ✅ Autocomplete responsive
- ✅ Highlighting enabled
- ✅ Aggregations accurate
- ✅ Search tracked in analytics

---

### 4. Advanced Search Features
**Goal**: Implement sophisticated search capabilities

- [ ] Implement fuzzy search for typo tolerance
- [ ] Add synonym support
- [ ] Implement boosting for relevance
- [ ] Add geo-spatial search (if needed)
- [ ] Implement personalized search
- [ ] Add "did you mean" suggestions
- [ ] Implement search filters UI support
- [ ] Add saved searches functionality

**Actions**:
```typescript
// Fuzzy search with synonyms
const searchQuery = {
  bool: {
    should: [
      {
        multi_match: {
          query,
          fields: ['title^3', 'description^2'],
          fuzziness: 'AUTO',
          prefix_length: 2,
        }
      },
      {
        match: {
          title: {
            query,
            boost: 2,
            analyzer: 'synonym_analyzer', // with synonyms
          }
        }
      }
    ],
    minimum_should_match: 1,
  }
};

// Personalized search
const personalizedQuery = {
  function_score: {
    query: baseQuery,
    functions: [
      {
        filter: { term: { category: user.preferredCategory } },
        weight: 2,
      },
      {
        gauss: {
          createdAt: {
            origin: 'now',
            scale: '30d',
            decay: 0.5,
          }
        }
      }
    ],
    score_mode: 'sum',
  }
};

// Geo-spatial search
const geoQuery = {
  bool: {
    must: { match_all: {} },
    filter: {
      geo_distance: {
        distance: '10km',
        location: {
          lat: user.latitude,
          lon: user.longitude,
        }
      }
    }
  }
};
```

**Success Criteria**:
- ✅ Fuzzy search handling typos
- ✅ Synonyms working
- ✅ Boosting improving relevance
- ✅ Geo-search functional (if implemented)
- ✅ Personalization improving results
- ✅ Suggestions helpful
- ✅ Filter UI data available
- ✅ Saved searches working

---

### 5. Search Performance Optimization
**Goal**: Fast and efficient search operations

- [ ] Implement search result caching
- [ ] Optimize index settings for read performance
- [ ] Use routing for better shard allocation
- [ ] Implement search request profiling
- [ ] Optimize mappings (disable unnecessary features)
- [ ] Use index aliases for zero-downtime reindexing
- [ ] Implement search query optimization
- [ ] Monitor and tune JVM settings

**Actions**:
```typescript
// Cache search results
@UseInterceptors(CacheInterceptor)
@CacheTTL(300) // 5 minutes
@Query(() => SearchResults)
async search(@Args('query') query: string) {
  // Search implementation
}

// Optimize query with filters instead of queries where possible
const optimizedQuery = {
  bool: {
    must: [
      { match: { title: query } } // Scoring query
    ],
    filter: [ // Non-scoring filters (faster)
      { term: { status: 'published' } },
      { range: { createdAt: { gte: 'now-30d' } } },
    ]
  }
};

// Use routing for better performance
await this.elasticsearchService.search({
  index: 'posts',
  routing: userId, // Routes to specific shard
  body: { query },
});
```

**Optimization Checklist**:
- ✅ Enable caching for common queries
- ✅ Use `filter` context instead of `query` where possible
- ✅ Disable `_source` if not needed
- ✅ Use `fields` API for specific field retrieval
- ✅ Implement routing for multi-tenant scenarios
- ✅ Use index aliases
- ✅ Monitor slow queries
- ✅ Tune refresh interval

**Success Criteria**:
- ✅ Search latency < 100ms (p95)
- ✅ Cache hit rate > 50%
- ✅ Index optimized for reads
- ✅ Routing implemented where beneficial
- ✅ No slow queries detected
- ✅ Zero-downtime reindexing working
- ✅ Query DSL optimized
- ✅ JVM settings tuned

---

### 6. Data Synchronization & Consistency
**Goal**: Keep search index in sync with source data

- [ ] Implement full reindexing process
- [ ] Add incremental updates via events
- [ ] Handle eventual consistency
- [ ] Implement sync verification
- [ ] Add manual reindex triggers
- [ ] Handle bulk updates efficiently
- [ ] Implement index versioning
- [ ] Add rollback capabilities

**Actions**:
```typescript
// Full reindex
async reindexAll(entityType: string) {
  const newIndex = `${entityType}-${Date.now()}`;
  
  // Create new index
  await this.elasticsearchService.indices.create({ index: newIndex });
  
  // Fetch all entities from database
  const entities = await this.prisma[entityType].findMany();
  
  // Bulk index
  const operations = entities.flatMap(entity => [
    { index: { _index: newIndex, _id: entity.id } },
    this.transformToDocument(entity),
  ]);
  
  await this.elasticsearchService.bulk({ operations });
  
  // Update alias atomically
  await this.elasticsearchService.indices.updateAliases({
    body: {
      actions: [
        { remove: { index: `${entityType}-*`, alias: entityType } },
        { add: { index: newIndex, alias: entityType } },
      ]
    }
  });
  
  // Delete old indices
  await this.deleteOldIndices(entityType, newIndex);
}

// Verify sync
async verifySyncStatus(entityType: string) {
  const dbCount = await this.prisma[entityType].count();
  const esCount = await this.elasticsearchService.count({ index: entityType });
  
  const status = {
    inSync: dbCount === esCount.count,
    dbCount,
    esCount: esCount.count,
    diff: Math.abs(dbCount - esCount.count),
  };
  
  if (!status.inSync) {
    this.logger.warn('Sync mismatch detected', status);
  }
  
  return status;
}
```

**Success Criteria**:
- ✅ Full reindex process working
- ✅ Incremental updates via events
- ✅ Eventual consistency acceptable
- ✅ Sync verification automated
- ✅ Manual reindex available
- ✅ Bulk updates efficient
- ✅ Index versioning implemented
- ✅ Rollback tested and working

---

### 7. Search Analytics & Monitoring
**Goal**: Track and improve search quality

- [ ] Track search queries and frequency
- [ ] Monitor search result click-through rates
- [ ] Track zero-result searches
- [ ] Implement search quality metrics
- [ ] Monitor search latency
- [ ] Track popular searches
- [ ] Implement A/B testing for search algorithms
- [ ] Create search analytics dashboard

**Actions**:
```typescript
// Track search analytics
async trackSearch(searchData: SearchAnalytics) {
  await this.analyticsService.track({
    event: 'search_performed',
    userId: searchData.userId,
    query: searchData.query,
    resultsCount: searchData.resultsCount,
    latency: searchData.latency,
    filters: searchData.filters,
    timestamp: new Date(),
  });
  
  // Track zero results
  if (searchData.resultsCount === 0) {
    await this.analyticsService.track({
      event: 'zero_results_search',
      query: searchData.query,
    });
  }
}

// Track click-through
async trackSearchClick(query: string, resultId: string, position: number) {
  await this.analyticsService.track({
    event: 'search_result_clicked',
    query,
    resultId,
    position,
    timestamp: new Date(),
  });
}
```

**Metrics to Track**:
- Total searches
- Zero-result searches rate
- Average results per search
- Click-through rate (CTR)
- Average search latency
- Popular search terms
- Search conversion rate
- User engagement with results

**Success Criteria**:
- ✅ All search events tracked
- ✅ CTR being measured
- ✅ Zero-result searches monitored
- ✅ Quality metrics defined
- ✅ Latency tracked per query
- ✅ Popular searches identified
- ✅ A/B testing framework ready
- ✅ Dashboard created

---

## 🔍 Validation Commands

Test search and indexing functionality:

```bash
# Check Elasticsearch indices
curl http://localhost:9200/_cat/indices?v

# Test indexing
curl -X POST "http://localhost:9200/users/_doc/1" \
  -H 'Content-Type: application/json' \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Test search
curl -X GET "http://localhost:9200/users/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d '{"query":{"match":{"name":"John"}}}'

# Test GraphQL search
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ search(query: \"john\") { hits { id name } } }"}'

# Check searcher service logs
docker-compose logs -f searcher

# Monitor Kafka consumer lag
docker exec -it kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe --group searcher-group
```

---

## 🆘 Common Issues

### Documents not being indexed
- **Solution**: Check Kafka consumer is running and consuming messages
- **Command**: `docker-compose logs searcher`

### Search returning no results
- **Solution**: Verify documents are indexed and mappings are correct
- **Command**: `curl http://localhost:9200/your-index/_count`

### Slow search performance
- **Solution**: Optimize query, enable caching, check shard allocation
- **Command**: Profile slow queries with `"profile": true` in query

### Index out of sync with database
- **Solution**: Run full reindex or check event consumer lag
- **Command**: Verify sync status endpoint

---

## 📚 Next Steps

Once search and indexing are operational, proceed to:
- [Development & Deployment Tasks](06-development-deployment.md)
- [Plugin System Tasks](07-plugin-system.md)
