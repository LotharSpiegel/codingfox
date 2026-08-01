---
title: "Migrating from RestTemplate to RestClient in Spring Boot"
date: 2026-03-25T16:18:00+01:00
draft: false
tags: ["spring-boot", "rest", "java", "migration"]
categories: ["Backend Development"]
---

## Introduction

Since Spring Boot 3.2, `RestTemplate` has been deprecated in favor of the modern `RestClient` API. This migration guide explores why `RestClient` is the superior choice and demonstrates how to effectively replace `RestTemplate` in your existing codebase.

## Why RestClient?

### 1. Modern Fluent API

`RestClient` provides a fluent, chainable API that significantly improves code readability:

**Before (RestTemplate):**
```java
HttpEntity<RequestBody> entity = new HttpEntity<>(requestBody, headers);
ResponseEntity<ResponseObject[]> response = restTemplate.exchange(
    url, 
    HttpMethod.POST, 
    entity, 
    ResponseObject[].class
);
ResponseObject[] data = response.getBody();
```

**After (RestClient):**
```java
ResponseObject[] data = restClient.post()
    .uri(url)
    .body(requestBody)
    .retrieve()
    .body(ResponseObject[].class);
```

The fluent API eliminates boilerplate code and makes the request flow self-documenting.

### 2. Reduced Boilerplate

RestClient eliminates the need for:
- Manual `HttpEntity` creation
- Explicit `HttpMethod` specification
- Verbose `ResponseEntity` handling
- Repetitive header configuration

### 3. Standardized Error Handling

RestClient integrates seamlessly with RFC 7807 Problem Details, providing consistent error responses across your API:

```java
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid request parameters",
  "instance": "/api/endpoint",
  "timestamp": "2026-03-25T15:18:00Z"
}
```

### 4. Better Type Safety

RestClient offers improved type safety with `ParameterizedTypeReference`:

```java
List<User> users = restClient.get()
    .uri("/users")
    .retrieve()
    .body(new ParameterizedTypeReference<List<User>>() {});
```

### 5. Declarative HTTP Interfaces

RestClient supports `@HttpExchange` annotations for declarative API definitions, reducing imperative code:

```java
@HttpExchange
public interface UserApiClient {
    
    @GetExchange("/users/{id}")
    User getUser(@PathVariable Long id);
    
    @PostExchange("/users")
    User createUser(@RequestBody User user);
}
```

## Setting Up RestClient Configuration

### Basic Configuration

Create a central configuration class to define your `RestClient` with common settings:

```java
@Configuration
public class RestClientConfig {

    @Value("${rest-client.connect-timeout:5000}")
    private int connectTimeout;

    @Value("${rest-client.read-timeout:30000}")
    private int readTimeout;

    @Bean
    public RestClient.Builder restClientBuilder(
            RestClientLoggingInterceptor loggingInterceptor) {
        
        return RestClient.builder()
            .requestFactory(clientHttpRequestFactory())
            .defaultHeaders(headers -> {
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            })
            .requestInterceptor(loggingInterceptor)
            .defaultStatusHandler(
                HttpStatusCode::isError,
                (request, response) -> {
                    throw new RestClientException(
                        createProblemDetail(request, response)
                    );
                }
            );
    }

    @Bean
    public ClientHttpRequestFactory clientHttpRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(connectTimeout));
        factory.setReadTimeout(Duration.ofMillis(readTimeout));
        return factory;
    }

    private ProblemDetail createProblemDetail(
            ClientHttpRequest request, 
            ClientHttpResponse response) throws IOException {
        
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            response.getStatusCode(),
            "HTTP error occurred"
        );
        problem.setInstance(URI.create(request.getURI().toString()));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }
}
```

### Application Configuration

Add timeout configuration to `application.yaml`:

```yaml
rest-client:
  connect-timeout: 5000
  read-timeout: 30000
```

## Implementing Request/Response Logging

Create an interceptor for comprehensive logging:

```java
@Slf4j
@Component
public class RestClientLoggingInterceptor implements ClientHttpRequestInterceptor {

    @Override
    public ClientHttpResponse intercept(
            HttpRequest request, 
            byte[] body, 
            ClientHttpRequestExecution execution) throws IOException {
        
        logRequest(request, body);
        ClientHttpResponse response = execution.execute(request, body);
        logResponse(response);
        return response;
    }

    private void logRequest(HttpRequest request, byte[] body) {
        if (log.isDebugEnabled()) {
            log.debug("=== Request Begin ===");
            log.debug("URI    : {}", request.getURI());
            log.debug("Method : {}", request.getMethod());
            log.debug("Headers: {}", request.getHeaders());
            if (body.length > 0) {
                log.debug("Body   : {}", new String(body, StandardCharsets.UTF_8));
            }
            log.debug("=== Request End ===");
        }
    }

    private void logResponse(ClientHttpResponse response) throws IOException {
        if (log.isDebugEnabled()) {
            log.debug("=== Response Begin ===");
            log.debug("Status : {} {}", response.getStatusCode(), response.getStatusText());
            log.debug("Headers: {}", response.getHeaders());
            
            // Log body only for errors to preserve performance
            if (response.getStatusCode().isError()) {
                String body = StreamUtils.copyToString(
                    response.getBody(), 
                    StandardCharsets.UTF_8
                );
                log.debug("Body   : {}", body);
            }
            log.debug("=== Response End ===");
        }
    }
}
```

## Migration Examples

### Example 1: Simple GET Request

**Before:**
```java
ResponseEntity<User> response = restTemplate.getForEntity(
    "/users/{id}", 
    User.class, 
    userId
);
User user = response.getBody();
```

**After:**
```java
User user = restClient.get()
    .uri("/users/{id}", userId)
    .retrieve()
    .body(User.class);
```

### Example 2: POST with Headers

**Before:**
```java
HttpHeaders headers = new HttpHeaders();
headers.set("X-User-Id", userId);
headers.setContentType(MediaType.APPLICATION_JSON);

HttpEntity<CreateRequest> entity = new HttpEntity<>(request, headers);

ResponseEntity<CreateResponse> response = restTemplate.exchange(
    "/api/create",
    HttpMethod.POST,
    entity,
    CreateResponse.class
);
```

**After:**
```java
CreateResponse response = restClient.post()
    .uri("/api/create")
    .header("X-User-Id", userId)
    .contentType(MediaType.APPLICATION_JSON)
    .body(request)
    .retrieve()
    .body(CreateResponse.class);
```

### Example 3: Generic Collections

**Before:**
```java
ResponseEntity<List<Item>> response = restTemplate.exchange(
    "/items",
    HttpMethod.GET,
    null,
    new ParameterizedTypeReference<List<Item>>() {}
);
List<Item> items = response.getBody();
```

**After:**
```java
List<Item> items = restClient.get()
    .uri("/items")
    .retrieve()
    .body(new ParameterizedTypeReference<List<Item>>() {});
```

### Example 4: Conditional Headers

**Before:**
```java
HttpHeaders headers = new HttpHeaders();
if (username != null) {
    headers.set("X-Username", username);
}
HttpEntity<?> entity = new HttpEntity<>(requestBody, headers);

restTemplate.exchange(url, HttpMethod.POST, entity, Response.class);
```

**After:**
```java
RestClient.RequestBodySpec spec = restClient.post()
    .uri(url)
    .body(requestBody);

if (username != null) {
    spec = spec.header("X-Username", username);
}

Response response = spec.retrieve().body(Response.class);
```

## Declarative HTTP Interfaces with @HttpExchange

For frequently used endpoints, define declarative interfaces:

```java
@HttpExchange("/api")
public interface ApiClient {
    
    @GetExchange("/users/{id}")
    User getUser(@PathVariable Long id);
    
    @PostExchange("/users")
    User createUser(@RequestBody UserRequest request);
    
    @PutExchange("/users/{id}")
    User updateUser(
        @PathVariable Long id, 
        @RequestBody UserRequest request
    );
    
    @DeleteExchange("/users/{id}")
    void deleteUser(@PathVariable Long id);
    
    @GetExchange("/users")
    List<User> searchUsers(@RequestParam String query);
}
```

### Configuration for HTTP Interfaces

```java
@Configuration
public class HttpInterfaceConfig {

    @Bean
    public ApiClient apiClient(RestClient.Builder builder) {
        RestClient restClient = builder
            .baseUrl("https://api.example.com")
            .build();
        
        HttpServiceProxyFactory factory = HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(restClient))
            .build();
        
        return factory.createClient(ApiClient.class);
    }
}
```

### Usage

```java
@Service
public class UserService {
    
    private final ApiClient apiClient;
    
    public UserService(ApiClient apiClient) {
        this.apiClient = apiClient;
    }
    
    public User findUser(Long id) {
        return apiClient.getUser(id);
    }
    
    public User createUser(UserRequest request) {
        return apiClient.createUser(request);
    }
}
```

## Testing with RestClient

### Mocking the Fluent API

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private RestClient restClient;
    
    @Mock
    private RestClient.RequestHeadersUriSpec<?> requestHeadersUriSpec;
    
    @Mock
    private RestClient.ResponseSpec responseSpec;
    
    @InjectMocks
    private UserService userService;

    @Test
    void shouldGetUser() {
        // Arrange
        User expectedUser = new User(1L, "John Doe");
        
        when(restClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString(), any(Object[].class)))
            .thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(User.class)).thenReturn(expectedUser);
        
        // Act
        User result = userService.getUser(1L);
        
        // Assert
        assertThat(result).isEqualTo(expectedUser);
    }
}
```

### Integration Testing with MockRestServiceServer

```java
@SpringBootTest
class UserServiceIntegrationTest {

    @Autowired
    private RestClient.Builder restClientBuilder;
    
    private MockRestServiceServer mockServer;
    private UserService userService;

    @BeforeEach
    void setUp() {
        RestClient restClient = restClientBuilder.build();
        mockServer = MockRestServiceServer.bindTo(restClient).build();
        userService = new UserService(restClient);
    }

    @Test
    void shouldGetUser() throws Exception {
        // Arrange
        mockServer.expect(requestTo("/users/1"))
            .andExpect(method(HttpMethod.GET))
            .andRespond(withSuccess(
                "{\"id\":1,\"name\":\"John Doe\"}", 
                MediaType.APPLICATION_JSON
            ));
        
        // Act
        User user = userService.getUser(1L);
        
        // Assert
        assertThat(user.getName()).isEqualTo("John Doe");
        mockServer.verify();
    }
}
```

## Migration Checklist

When migrating from RestTemplate to RestClient:

- [ ] Create central `RestClient.Builder` configuration
- [ ] Implement logging interceptor
- [ ] Configure timeouts and default headers
- [ ] Set up standardized error handling with ProblemDetail
- [ ] Replace `restTemplate.exchange()` with fluent API
- [ ] Remove manual `HttpEntity` and `HttpHeaders` creation
- [ ] Update unit tests to mock fluent API chain
- [ ] Consider `@HttpExchange` interfaces for frequently used endpoints
- [ ] Update integration tests with `MockRestServiceServer`
- [ ] Remove `RestTemplate` bean definitions

## Key Advantages Summary

| Aspect | RestTemplate | RestClient |
|--------|--------------|------------|
| **API Style** | Imperative, verbose | Fluent, chainable |
| **Boilerplate** | High | Minimal |
| **Readability** | Moderate | Excellent |
| **Type Safety** | Good | Excellent |
| **Error Handling** | Manual | Standardized (RFC 7807) |
| **Declarative APIs** | Not supported | `@HttpExchange` support |
| **Maintenance Status** | Deprecated | Active development |
| **Modern Features** | Limited | Comprehensive |

## Conclusion

Migrating from `RestTemplate` to `RestClient` modernizes your Spring Boot application with:

- **Cleaner, more readable code** through fluent API design
- **Reduced boilerplate** with intelligent defaults
- **Standardized error handling** using RFC 7807 Problem Details
- **Better maintainability** with centralized configuration
- **Declarative options** via `@HttpExchange` interfaces
- **Future-proof architecture** aligned with Spring's direction

The migration effort is minimal compared to the long-term benefits of improved code quality, maintainability, and developer experience.

## Resources

- [Spring RestClient Documentation](https://docs.spring.io/spring-framework/reference/integration/rest-clients.html#rest-restclient)
- [RFC 7807 - Problem Details for HTTP APIs](https://tools.ietf.org/html/rfc7807)
- [Spring HTTP Interface Documentation](https://docs.spring.io/spring-framework/reference/integration/rest-clients.html#rest-http-interface)
- [Spring Boot 3.2 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.2-Release-Notes)
