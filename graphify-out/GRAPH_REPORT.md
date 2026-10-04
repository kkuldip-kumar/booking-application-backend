# Graph Report - bookmyshow-backend  (2026-10-04)

## Corpus Check
- 209 files · ~35,434 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1726 nodes · 4427 edges · 104 communities (90 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f23b6cb1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CurrentUser
- movie-lifecycle.service.ts
- lookups.controller.ts
- movies.service.ts
- Public
- showtimes.service.ts
- JwtUser
- auth.module.ts
- movie-relations.service.ts
- Showtime
- User
- screens.service.ts
- movie-query.service.ts
- movies.module.ts
- seat-layouts.service.ts
- Paginated
- AdminScreensController
- AuthMailer
- auth.service.ts
- dependencies
- AccessTokenService
- CreateSeatLayoutDto
- devDependencies
- RbacController
- MoviesService
- compilerOptions
- ShowtimesService
- Seat
- people.service.ts
- CinemasService
- PeopleService
- ShowtimeResponseDto
- AdminCinemasController
- cinemas.service.ts
- admin-movies.controller.ts
- MovieCredit
- UpdateProfileDto
- Cinema
- RefreshTokenService
- AdminPeopleController
- ShowtimeBaseDto
- CreateMovieDto
- admin-people.controller.ts
- Role
- ScreensService
- rbac.service.ts
- CreateCinemaDto
- CreditResponseDto
- main.ts
- seed.ts
- app.module.ts
- LocalMediaStorage
- CreateRoleDto
- scripts
- PaginationQueryDto
- PeopleController
- showtime-slots.util.ts
- .list
- Movie
- UpdateShowtimePricingDto
- jest
- exclude
- OpaqueTokenGenerator
- CreateScreenDto
- ScreensController
- CreatePersonDto
- AddCinemaImageDto
- RbacService
- ShowtimePricing
- nest-cli.json
- CreateMoviesModule1760000000000
- PermissionsGuard
- RolesGuard
- AuthFoundation1750000000000
- CinemaOperations1760000000000
- docker.sh
- class-validator
- @nestjs/bullmq
- cookie-parser
- @nestjs/core
- @nestjs/swagger
- nodemailer
- reflect-metadata
- typeorm
- SeatType
- PRD — BookMyShow Backend
- Production
- Seat
- API (base `/api/v1`)
- Tasks
- Testing Strategy
- ShowtimeSeat
- Database (PostgreSQL + TypeORM)
- BookMyShow Backend — Agent Entry Point
- ADR-0001: Seat Locking Strategy
- Memory — Decisions, Gotchas, Lessons
- BookMyShow Backend
- MovieScheduleRegistrar
- QueryShowtimesDto
- ReplaceCreditsDto
- AuditLog1770000000000
- THREAT_MODEL.md
- @nestjs/config

## God Nodes (most connected - your core abstractions)
1. `JwtUser` - 104 edges
2. `Movie` - 55 edges
3. `CurrentUser` - 54 edges
4. `Showtime` - 35 edges
5. `AdminMovieDetailDto` - 31 edges
6. `Screen` - 31 edges
7. `ShowtimeResponseDto` - 31 edges
8. `ScreensService` - 30 edges
9. `User` - 29 edges
10. `MovieStatus` - 28 edges

## Surprising Connections (you probably didn't know these)
- `seedPermissions()` --indirect_call--> `Permission`  [INFERRED]
  scripts/seed.ts → src/modules/rbac/entities/permission.entity.ts
- `seedRoles()` --indirect_call--> `Role`  [INFERRED]
  scripts/seed.ts → src/modules/rbac/entities/role.entity.ts
- `seedSuperAdmin()` --indirect_call--> `UserRole`  [INFERRED]
  scripts/seed.ts → src/modules/rbac/entities/user-role.entity.ts
- `seedSuperAdmin()` --indirect_call--> `User`  [INFERRED]
  scripts/seed.ts → src/modules/users/entities/user.entity.ts
- `seedRoles()` --indirect_call--> `SystemRole`  [INFERRED]
  scripts/seed.ts → src/common/enums/system-role.enum.ts

## Import Cycles
- None detected.

## Communities (104 total, 14 thin omitted)

### Community 0 - "CurrentUser"
Cohesion: 0.05
Nodes (68): ApiBody, ApiConsumes, Req, Res, ClientCtx, CurrentUser, Public(), JwtUser (+60 more)

### Community 1 - "movie-lifecycle.service.ts"
Cohesion: 0.11
Nodes (24): isPubliclyVisible(), MovieStatus, PUBLIC_MOVIE_STATUSES, applyStatus(), LifecycleFields, NOW, ALLOWED, canTransition() (+16 more)

### Community 2 - "lookups.controller.ts"
Cohesion: 0.09
Nodes (29): Roles(), CreateGenreDto, CreatePersonDto, SearchPeopleQueryDto, IsOptional, IsString, IsUrl, Length (+21 more)

### Community 3 - "movies.service.ts"
Cohesion: 0.11
Nodes (27): BaseTimestampedEntity, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, AgeRating, Column, Entity, Index (+19 more)

### Community 4 - "Public"
Cohesion: 0.28
Nodes (16): STRICT, ChangePasswordDto, EmailDto, LoginDto, RegisterDto, ResetPasswordDto, TokenDto, ApiProperty (+8 more)

### Community 5 - "showtimes.service.ts"
Cohesion: 0.20
Nodes (13): ADR-0001, SCHEDULABLE_MOVIE_STATUSES, ShowFormat, ShowtimeSeatStatus, ShowtimeStatus, QueryPublicShowtimesDto, BulkCreateResultDto, SeatSummary (+5 more)

### Community 6 - "JwtUser"
Cohesion: 0.24
Nodes (3): SeatLayoutResponseDto, SeatLayoutsService, Injectable

### Community 7 - "auth.module.ts"
Cohesion: 0.13
Nodes (14): mailConfig, MailRecipient, MailJob, MailTemplate, MailProcessor, Rendered, Inject, Processor (+6 more)

### Community 8 - "movie-relations.service.ts"
Cohesion: 0.13
Nodes (21): LanguageType, MovieAssetType, MovieSortOrder, MovieLanguage, Column, CreateDateColumn, Entity, Index (+13 more)

### Community 9 - "Showtime"
Cohesion: 0.12
Nodes (14): Showtime, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn (+6 more)

### Community 10 - "User"
Cohesion: 0.09
Nodes (16): AuthMailer, AuthService, Injectable, EmailVerificationService, Injectable, PasswordService, Injectable, Column (+8 more)

### Community 11 - "screens.service.ts"
Cohesion: 0.10
Nodes (19): Screen, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn (+11 more)

### Community 12 - "movie-query.service.ts"
Cohesion: 0.08
Nodes (29): AdminListMoviesQueryDto, ListMoviesQueryDto, IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString (+21 more)

### Community 13 - "movies.module.ts"
Cohesion: 0.23
Nodes (5): MovieScheduleProcessor, Processor, MovieScheduleService, Injectable, InjectRepository

### Community 14 - "seat-layouts.service.ts"
Cohesion: 0.19
Nodes (14): SeatLayoutStatus, SeatStatus, ScreensModule, Module, SeatResponseDto, IsBoolean, IsEnum, IsOptional (+6 more)

### Community 15 - "Paginated"
Cohesion: 0.18
Nodes (11): ShowtimeResponseDto, ShowtimeQueryService, Injectable, ShowtimesController, ApiOkResponse, ApiOperation, ApiTags, Controller (+3 more)

### Community 16 - "AdminScreensController"
Cohesion: 0.18
Nodes (12): AdminScreensController, ApiOkResponse, ApiOperation, ApiTags, Body, Controller, Delete, HttpCode (+4 more)

### Community 17 - "AuthMailer"
Cohesion: 0.16
Nodes (14): VERIFICATION_TTL_MINUTES, UserStatus, VerificationTokenType, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn (+6 more)

### Community 18 - "auth.service.ts"
Cohesion: 0.08
Nodes (16): isUniqueViolation(), escapeLike(), toBoolean(), trimString(), loadAllOrFail(), UpdateMovieDto, Inject, MovieAuditAction (+8 more)

### Community 19 - "dependencies"
Cohesion: 0.08
Nodes (25): argon2, bullmq, class-transformer, helmet, @nestjs/common, @nestjs/jwt, @nestjs/platform-express, @nestjs/throttler (+17 more)

### Community 20 - "AccessTokenService"
Cohesion: 0.18
Nodes (7): authConfig, AccessPayload, AuthCookieService, Inject, Injectable, Inject, AuthSession

### Community 21 - "CreateSeatLayoutDto"
Cohesion: 0.12
Nodes (21): CreateSeatLayoutDto, LayoutRowDto, ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsInt, IsOptional (+13 more)

### Community 22 - "devDependencies"
Cohesion: 0.09
Nodes (23): jest, @nestjs/cli, @nestjs/testing, devDependencies, jest, @nestjs/cli, @nestjs/testing, ts-jest (+15 more)

### Community 23 - "RbacController"
Cohesion: 0.12
Nodes (14): RequirePermissions(), RbacController, ApiOperation, ApiTags, Body, Controller, Delete, Get (+6 more)

### Community 24 - "MoviesService"
Cohesion: 0.25
Nodes (9): MovieDetailDto, MoviesController, ApiOkResponse, ApiOperation, ApiTags, Controller, Get, Param (+1 more)

### Community 25 - "compilerOptions"
Cohesion: 0.09
Nodes (21): scripts, compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators (+13 more)

### Community 26 - "ShowtimesService"
Cohesion: 0.15
Nodes (5): ShowtimeSchedulingService, Injectable, ShowtimesService, Injectable, InjectRepository

### Community 27 - "Seat"
Cohesion: 0.18
Nodes (10): SeatLayout, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn (+2 more)

### Community 28 - "people.service.ts"
Cohesion: 0.83
Nodes (3): isExclusionViolation(), isForeignKeyViolation(), pgCode()

### Community 29 - "CinemasService"
Cohesion: 0.25
Nodes (6): assertCinemaAccess(), hasGlobalCinemaAccess(), ApiOkResponse, CinemasService, Injectable, CinemaResponseDto

### Community 30 - "PeopleService"
Cohesion: 0.24
Nodes (5): slugify(), withRandomSuffix(), PersonResponseDto, PeopleService, Injectable

### Community 31 - "ShowtimeResponseDto"
Cohesion: 0.12
Nodes (20): CreditType, CreditItemDto, IsEnum, IsInt, IsOptional, IsString, Length, Max (+12 more)

### Community 32 - "AdminCinemasController"
Cohesion: 0.19
Nodes (10): AdminCinemasController, ApiOperation, ApiTags, Body, Controller, Delete, Get, HttpCode (+2 more)

### Community 33 - "cinemas.service.ts"
Cohesion: 0.26
Nodes (8): CinemaStatus, paginate(), escapeLike(), pickDefined(), QueryPublicCinemasDto, IsEnum, UpdateCinemaDto, UpdateCinemaStatusDto

### Community 34 - "admin-movies.controller.ts"
Cohesion: 0.12
Nodes (17): DetectedImage, detectImage(), JPEG_SIGNATURE, PNG_SIGNATURE, lockMovieOrFail(), MovieAsset, Column, Entity (+9 more)

### Community 35 - "MovieCredit"
Cohesion: 0.12
Nodes (23): PUBLIC_MOVIE_STATUSES, CreditType, FilmographyItemDto, UpdatePersonDto, MovieCredit, Column, CreateDateColumn, Entity (+15 more)

### Community 36 - "UpdateProfileDto"
Cohesion: 0.11
Nodes (17): ApiPropertyOptional, IsOptional, IsString, Matches, MaxLength, MinLength, UpdateProfileDto, UserResponseDto (+9 more)

### Community 37 - "Cinema"
Cohesion: 0.20
Nodes (9): InjectRepository, Cinema, Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn (+1 more)

### Community 38 - "RefreshTokenService"
Cohesion: 0.08
Nodes (14): PermissionsGuard, Injectable, ClientContext, RefreshToken, Column, CreateDateColumn, Entity, Index (+6 more)

### Community 39 - "AdminPeopleController"
Cohesion: 0.17
Nodes (14): AdminPeopleController, ApiOkResponse, ApiOperation, ApiTags, Body, Controller, Delete, Get (+6 more)

### Community 40 - "ShowtimeBaseDto"
Cohesion: 0.11
Nodes (29): BulkCreateShowtimesDto, CreateShowtimeDto, SeatTypePriceDto, ShowtimeBaseDto, ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray (+21 more)

### Community 41 - "CreateMovieDto"
Cohesion: 0.12
Nodes (17): CreateMovieDto, ArrayMaxSize, ArrayUnique, IsArray, IsInt, IsISO8601, IsOptional, IsString (+9 more)

### Community 42 - "admin-people.controller.ts"
Cohesion: 0.31
Nodes (10): AddCreditDto, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Max (+2 more)

### Community 43 - "Role"
Cohesion: 0.11
Nodes (24): Permission, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Role, Column, CreateDateColumn (+16 more)

### Community 44 - "ScreensService"
Cohesion: 0.22
Nodes (5): Get, ScreenResponseDto, ScreensService, Injectable, row()

### Community 45 - "rbac.service.ts"
Cohesion: 0.23
Nodes (10): ScreenStatus, CinemasModule, Module, CreateMaintenanceDto, IsDate, IsString, Length, Type (+2 more)

### Community 46 - "CreateCinemaDto"
Cohesion: 0.16
Nodes (13): IsLatitude, IsLongitude, IsIanaTimezone(), isIanaTimezone(), CreateCinemaDto, ArrayMaxSize, IsArray, IsEmail (+5 more)

### Community 47 - "CreditResponseDto"
Cohesion: 0.31
Nodes (5): isUniqueViolation(), CreditsService, Injectable, InjectRepository, CreditResponseDto

### Community 48 - "main.ts"
Cohesion: 0.19
Nodes (8): Catch, AppModule, Module, HttpExceptionFilter, ApiEnvelope, ResponseInterceptor, Injectable, bootstrap()

### Community 49 - "seed.ts"
Cohesion: 0.32
Nodes (10): logger, main(), seedPermissions(), seedRoles(), seedSuperAdmin(), DEFAULT_ROLE_PERMISSIONS, PermissionCode, PERMISSIONS (+2 more)

### Community 50 - "app.module.ts"
Cohesion: 0.18
Nodes (10): ENTITIES, appConfig, databaseConfig, EnvironmentVariables, IsNotEmpty, IsString, MinLength, validateEnv() (+2 more)

### Community 51 - "LocalMediaStorage"
Cohesion: 0.25
Nodes (3): LocalMediaStorage, Injectable, MediaStorage

### Community 52 - "CreateRoleDto"
Cohesion: 0.23
Nodes (12): AssignRoleDto, CreateRoleDto, SetRolePermissionsDto, ApiProperty, ApiPropertyOptional, ArrayMaxSize, IsArray, IsOptional (+4 more)

### Community 53 - "scripts"
Cohesion: 0.17
Nodes (11): name, private, scripts, build, lint, migration:revert, migration:run, seed (+3 more)

### Community 54 - "PaginationQueryDto"
Cohesion: 0.29
Nodes (7): Paginated, Query, QueryCinemasDto, IsEnum, IsOptional, IsString, Length

### Community 55 - "PeopleController"
Cohesion: 0.27
Nodes (8): PeopleController, ApiOkResponse, ApiOperation, ApiTags, Controller, Get, Param, Query

### Community 56 - "showtime-slots.util.ts"
Cohesion: 0.33
Nodes (9): daysBetweenInclusive(), formatIsoDate(), offsetMinutes(), parseIsoDate(), zonedLocalToUtc(), computeSeatPrice(), BulkSlotInput, expandBulkSlots() (+1 more)

### Community 57 - ".list"
Cohesion: 0.24
Nodes (8): CinemasController, ApiOkResponse, ApiOperation, ApiTags, Controller, Get, Param, Query

### Community 58 - "Movie"
Cohesion: 0.15
Nodes (11): AuditLogService, AuditRecordInput, Injectable, InjectRepository, AuditModule, Module, AuditLog, Column (+3 more)

### Community 59 - "UpdateShowtimePricingDto"
Cohesion: 0.13
Nodes (14): Architecture, Booking Flow (seat locking), Booking State Machine, Cross-Cutting, Diagram, Folder Rules, HLD, Layers (+6 more)

### Community 60 - "jest"
Cohesion: 0.20
Nodes (10): jest, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.ts$, js (+2 more)

### Community 61 - "exclude"
Cohesion: 0.20
Nodes (9): dist, node_modules, **/*spec.ts, ./tsconfig.json, exclude, extends, include, src (+1 more)

### Community 62 - "OpaqueTokenGenerator"
Cohesion: 0.15
Nodes (8): RolesGuard, Injectable, Argon2PasswordHasher, Injectable, CryptoOpaqueTokenGenerator, Injectable, GeneratedToken, OpaqueTokenGenerator

### Community 63 - "CreateScreenDto"
Cohesion: 0.20
Nodes (10): CreateScreenDto, ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsInt, IsString, Length (+2 more)

### Community 64 - "ScreensController"
Cohesion: 0.22
Nodes (7): ScreensController, ApiOkResponse, ApiOperation, ApiTags, Controller, Get, Param

### Community 65 - "CreatePersonDto"
Cohesion: 0.15
Nodes (14): IsDateString, PaginationQueryDto, IsInt, IsOptional, Max, Min, Type, CreatePersonDto (+6 more)

### Community 66 - "AddCinemaImageDto"
Cohesion: 0.11
Nodes (20): CinemaImageType, Post, AddCinemaImageDto, CinemaImageResponseDto, IsEnum, IsInt, IsOptional, IsUrl (+12 more)

### Community 67 - "RbacService"
Cohesion: 0.15
Nodes (12): Authentication, Authorization (RBAC), Booking Abuse, Checklist (before release), Dependencies, HTTP Hardening, Input & Output, Logging & Privacy (+4 more)

### Community 68 - "ShowtimePricing"
Cohesion: 0.29
Nodes (7): ShowtimePricing, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn

### Community 69 - "nest-cli.json"
Cohesion: 0.40
Nodes (4): collection, compilerOptions, tsConfigPath, sourceRoot

### Community 71 - "PermissionsGuard"
Cohesion: 0.21
Nodes (10): slugify(), generateUniqueSlug(), recordStatusChange(), StatusChange, MovieStatusHistory, Column, CreateDateColumn, Entity (+2 more)

### Community 72 - "RolesGuard"
Cohesion: 0.17
Nodes (11): Automated Gates (CI: .github/workflows/security.yml), Control Mapping (API Top 10:2023), DAST (before each release), Data Protection, Finding Handling, Independent VAPT Scope (give to tester), Mandatory Bootstrap (main.ts), Release Gate Checklist (evidence required) (+3 more)

### Community 83 - "typeorm"
Cohesion: 0.20
Nodes (5): JwtAuthGuard, Injectable, AccessTokenService, Inject, Injectable

### Community 85 - "SeatType"
Cohesion: 0.22
Nodes (8): SeatTypeResponseDto, SeatType, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ApiOkResponse

### Community 86 - "PRD — BookMyShow Backend"
Cohesion: 0.20
Nodes (9): Booking Flow, Business Rules, Goal, MVP Features, Non-Functional, Out of Scope (MVP), PRD — BookMyShow Backend, Roles (+1 more)

### Community 87 - "Production"
Cohesion: 0.20
Nodes (9): Database, Docker, Environment Variables, Low-Cost Deployment, Monitoring, Production, Release Steps, Runbook (+1 more)

### Community 88 - "Seat"
Cohesion: 0.20
Nodes (10): Seat, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn (+2 more)

### Community 89 - "API (base `/api/v1`)"
Cohesion: 0.22
Nodes (8): Admin (role ADMIN), API (base `/api/v1`), Auth, Booking, Catalog (public), Example, Payments, Status Codes

### Community 90 - "Tasks"
Cohesion: 0.22
Nodes (8): Phase 0 — Setup, Phase 1 — Auth & Users, Phase 2 — Catalog, Phase 3 — Shows, Phase 4 — Seat Hold & Booking, Phase 5 — Payments & Tickets, Phase 6 — Hardening & Release, Tasks

### Community 91 - "Testing Strategy"
Cohesion: 0.22
Nodes (8): Commands, Concurrency Tests, Definition of Done, Must-Have Cases, Pyramid, Setup, Targets, Testing Strategy

### Community 92 - "ShowtimeSeat"
Cohesion: 0.22
Nodes (8): chunked(), ShowtimeSeat, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn

### Community 93 - "Database (PostgreSQL + TypeORM)"
Cohesion: 0.29
Nodes (6): Constraints, Database (PostgreSQL + TypeORM), ERD, Indexes, Migration Notes, Tables

### Community 94 - "BookMyShow Backend — Agent Entry Point"
Cohesion: 0.33
Nodes (5): BookMyShow Backend — Agent Entry Point, Commands, Docs (read only what the task needs), Stack, Working agreement

### Community 95 - "ADR-0001: Seat Locking Strategy"
Cohesion: 0.33
Nodes (5): ADR-0001: Seat Locking Strategy, Consequences, Context, Decision, Options

### Community 96 - "Memory — Decisions, Gotchas, Lessons"
Cohesion: 0.33
Nodes (5): Decisions, Don't Do Again, Gotchas, Memory — Decisions, Gotchas, Lessons, Open Questions

### Community 97 - "BookMyShow Backend"
Cohesion: 0.33
Nodes (5): BookMyShow Backend, Docs, Quick start, Scripts, Structure

### Community 98 - "MovieScheduleRegistrar"
Cohesion: 0.33
Nodes (3): MovieScheduleRegistrar, Injectable, InjectQueue

### Community 99 - "QueryShowtimesDto"
Cohesion: 0.33
Nodes (6): QueryShowtimesDto, IsDate, IsEnum, IsOptional, IsUUID, Type

### Community 100 - "ReplaceCreditsDto"
Cohesion: 0.40
Nodes (5): ReplaceCreditsDto, ArrayMaxSize, IsArray, Type, ValidateNested

## Knowledge Gaps
- **198 isolated node(s):** `collection`, `sourceRoot`, `tsConfigPath`, `name`, `version` (+193 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `JwtUser` connect `CurrentUser` to `movie-lifecycle.service.ts`, `Public`, `showtimes.service.ts`, `JwtUser`, `Showtime`, `seat-layouts.service.ts`, `Paginated`, `AdminScreensController`, `AccessTokenService`, `ShowtimesService`, `CinemasService`, `AdminCinemasController`, `cinemas.service.ts`, `UpdateProfileDto`, `RefreshTokenService`, `ShowtimeBaseDto`, `ScreensService`, `rbac.service.ts`, `PaginationQueryDto`, `AddCinemaImageDto`, `typeorm`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **Why does `Roles()` connect `lookups.controller.ts` to `AdminCinemasController`, `cinemas.service.ts`, `movie-lifecycle.service.ts`, `CurrentUser`, `MovieCredit`, `RefreshTokenService`, `AdminPeopleController`, `ShowtimeBaseDto`, `rbac.service.ts`, `seat-layouts.service.ts`, `AdminScreensController`, `CreateRoleDto`, `RbacController`, `CinemasService`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `Movie` connect `movie-query.service.ts` to `CurrentUser`, `movie-lifecycle.service.ts`, `admin-movies.controller.ts`, `movies.service.ts`, `MovieCredit`, `showtimes.service.ts`, `PermissionsGuard`, `movie-relations.service.ts`, `Showtime`, `movies.module.ts`, `CreditResponseDto`, `auth.service.ts`, `MoviesService`, `ShowtimesService`, `Seat`, `ShowtimeResponseDto`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `Movie` (e.g. with `generateUniqueSlug()` and `lockMovieOrFail()`) actually correct?**
  _`Movie` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `Showtime` (e.g. with `.block()` and `.cancel()`) actually correct?**
  _`Showtime` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `collection`, `sourceRoot`, `tsConfigPath` to the rest of the system?**
  _198 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CurrentUser` be split into smaller, more focused modules?**
  _Cohesion score 0.05238095238095238 - nodes in this community are weakly interconnected._