# Graph Report - .  (2026-10-04)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1581 nodes · 4212 edges · 85 communities (70 shown, 15 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `JwtUser` - 89 edges
2. `Movie` - 55 edges
3. `CurrentUser` - 48 edges
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
- `seedRoles()` --indirect_call--> `SystemRole`  [INFERRED]
  scripts/seed.ts → src/common/enums/system-role.enum.ts
- `seedRoles()` --indirect_call--> `Role`  [INFERRED]
  scripts/seed.ts → src/modules/rbac/entities/role.entity.ts
- `seedSuperAdmin()` --indirect_call--> `UserRole`  [INFERRED]
  scripts/seed.ts → src/modules/rbac/entities/user-role.entity.ts
- `seedSuperAdmin()` --indirect_call--> `User`  [INFERRED]
  scripts/seed.ts → src/modules/users/entities/user.entity.ts

## Import Cycles
- None detected.

## Communities (85 total, 15 thin omitted)

### Community 0 - "CurrentUser"
Cohesion: 0.08
Nodes (41): ApiBody, ApiConsumes, CurrentUser, AdminMoviesController, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation (+33 more)

### Community 1 - "movie-lifecycle.service.ts"
Cohesion: 0.08
Nodes (33): isPubliclyVisible(), MovieStatus, slugify(), applyStatus(), LifecycleFields, NOW, generateUniqueSlug(), recordStatusChange() (+25 more)

### Community 2 - "lookups.controller.ts"
Cohesion: 0.09
Nodes (30): escapeLike(), toBoolean(), trimString(), CreateGenreDto, CreatePersonDto, SearchPeopleQueryDto, IsOptional, IsString (+22 more)

### Community 3 - "movies.service.ts"
Cohesion: 0.09
Nodes (29): BaseTimestampedEntity, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, isUniqueViolation(), loadAllOrFail(), UpdateMovieDto, AgeRating (+21 more)

### Community 4 - "Public"
Cohesion: 0.15
Nodes (27): Req, Res, ClientCtx, Public(), AuthController, ApiOperation, ApiTags, Body (+19 more)

### Community 5 - "showtimes.service.ts"
Cohesion: 0.14
Nodes (20): ADR-0001, SCHEDULABLE_MOVIE_STATUSES, ShowFormat, ShowtimeSeatStatus, ShowtimeStatus, isExclusionViolation(), QueryShowtimesDto, IsDate (+12 more)

### Community 6 - "JwtUser"
Cohesion: 0.14
Nodes (16): JwtUser, SeatLayoutResponseDto, SeatLayoutsController, ApiOkResponse, ApiOperation, ApiTags, Body, Controller (+8 more)

### Community 7 - "auth.module.ts"
Cohesion: 0.09
Nodes (19): mailConfig, Argon2PasswordHasher, Injectable, MailRecipient, PasswordHasher, MailJob, MailTemplate, MailProcessor (+11 more)

### Community 8 - "movie-relations.service.ts"
Cohesion: 0.09
Nodes (30): CreditType, LanguageType, CreditDto, LanguageDto, MovieAssetsDto, PageMetaDto, MovieCredit, Column (+22 more)

### Community 9 - "Showtime"
Cohesion: 0.09
Nodes (22): chunked(), Showtime, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne (+14 more)

### Community 10 - "User"
Cohesion: 0.09
Nodes (15): AuthService, Injectable, PasswordService, Injectable, SessionService, Injectable, Column, CreateDateColumn (+7 more)

### Community 11 - "screens.service.ts"
Cohesion: 0.11
Nodes (24): ScreenStatus, pickDefined(), UpdateScreenDto, UpdateScreenStatusDto, Screen, Column, CreateDateColumn, Entity (+16 more)

### Community 12 - "movie-query.service.ts"
Cohesion: 0.11
Nodes (23): PUBLIC_MOVIE_STATUSES, AdminListMoviesQueryDto, ListMoviesQueryDto, MovieSortOrder, IsBoolean, IsEnum, IsIn, IsInt (+15 more)

### Community 13 - "movies.module.ts"
Cohesion: 0.10
Nodes (15): MovieAuditAction, MovieAuditEntry, MovieAuditService, Injectable, MEDIA_STORAGE, MoviesModule, Module, MovieScheduleProcessor (+7 more)

### Community 14 - "seat-layouts.service.ts"
Cohesion: 0.13
Nodes (21): SeatLayoutStatus, SeatStatus, ScreensModule, Module, SeatResponseDto, SeatTypeResponseDto, IsBoolean, IsEnum (+13 more)

### Community 15 - "Paginated"
Cohesion: 0.12
Nodes (16): assertCinemaAccess(), hasGlobalCinemaAccess(), Paginated, Get, Query, QueryPublicShowtimesDto, ShowtimeQueryService, Injectable (+8 more)

### Community 16 - "AdminScreensController"
Cohesion: 0.14
Nodes (18): AdminScreensController, ApiOkResponse, ApiOperation, ApiTags, Body, Controller, Delete, Get (+10 more)

### Community 17 - "AuthMailer"
Cohesion: 0.14
Nodes (13): VERIFICATION_TTL_MINUTES, VerificationTokenType, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, VerificationToken (+5 more)

### Community 18 - "auth.service.ts"
Cohesion: 0.19
Nodes (7): UserStatus, ClientContext, STRICT, ctx, IssuedRefreshToken, AuthSession, NewUser

### Community 19 - "dependencies"
Cohesion: 0.08
Nodes (25): argon2, bullmq, class-transformer, helmet, @nestjs/common, @nestjs/config, @nestjs/jwt, @nestjs/platform-express (+17 more)

### Community 20 - "AccessTokenService"
Cohesion: 0.11
Nodes (10): JwtAuthGuard, Injectable, authConfig, AccessPayload, AccessTokenService, Inject, Injectable, AuthCookieService (+2 more)

### Community 21 - "CreateSeatLayoutDto"
Cohesion: 0.11
Nodes (22): CreateSeatLayoutDto, LayoutRowDto, ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsInt, IsOptional (+14 more)

### Community 22 - "devDependencies"
Cohesion: 0.09
Nodes (23): jest, @nestjs/cli, @nestjs/testing, devDependencies, jest, @nestjs/cli, @nestjs/testing, ts-jest (+15 more)

### Community 23 - "RbacController"
Cohesion: 0.15
Nodes (12): RequirePermissions(), RbacController, ApiOperation, ApiTags, Body, Controller, Delete, Get (+4 more)

### Community 24 - "MoviesService"
Cohesion: 0.16
Nodes (13): MovieDetailDto, MovieRelationsService, Injectable, MoviesController, ApiOkResponse, ApiOperation, ApiTags, Controller (+5 more)

### Community 25 - "compilerOptions"
Cohesion: 0.09
Nodes (21): scripts, compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators (+13 more)

### Community 26 - "ShowtimesService"
Cohesion: 0.15
Nodes (5): ShowtimeSchedulingService, Injectable, ShowtimesService, Injectable, InjectRepository

### Community 27 - "Seat"
Cohesion: 0.10
Nodes (19): Seat, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn (+11 more)

### Community 28 - "people.service.ts"
Cohesion: 0.20
Nodes (11): PUBLIC_MOVIE_STATUSES, CreditType, isForeignKeyViolation(), isUniqueViolation(), pgCode(), escapeLike(), slugify(), withRandomSuffix() (+3 more)

### Community 29 - "CinemasService"
Cohesion: 0.26
Nodes (3): CinemasService, Injectable, CinemaResponseDto

### Community 30 - "PeopleService"
Cohesion: 0.21
Nodes (7): ApiOkResponse, Patch, Post, PersonResponseDto, UpdatePersonDto, PeopleService, Injectable

### Community 31 - "ShowtimeResponseDto"
Cohesion: 0.24
Nodes (13): AdminShowtimesController, ApiOkResponse, ApiOperation, ApiTags, Body, Controller, Param, Patch (+5 more)

### Community 32 - "AdminCinemasController"
Cohesion: 0.16
Nodes (14): Roles(), AdminCinemasController, ApiOkResponse, ApiOperation, ApiTags, Body, Controller, Delete (+6 more)

### Community 33 - "cinemas.service.ts"
Cohesion: 0.24
Nodes (10): CinemaImageType, CinemaStatus, paginate(), CinemasModule, Module, CinemaImageResponseDto, QueryPublicCinemasDto, IsEnum (+2 more)

### Community 34 - "admin-movies.controller.ts"
Cohesion: 0.17
Nodes (14): MovieAssetType, DetectedImage, detectImage(), JPEG_SIGNATURE, PNG_SIGNATURE, MovieAsset, Column, Entity (+6 more)

### Community 35 - "MovieCredit"
Cohesion: 0.11
Nodes (18): InjectRepository, MovieCredit, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne (+10 more)

### Community 36 - "UpdateProfileDto"
Cohesion: 0.13
Nodes (15): ApiPropertyOptional, IsOptional, IsString, Matches, MaxLength, MinLength, UpdateProfileDto, UserResponseDto (+7 more)

### Community 37 - "Cinema"
Cohesion: 0.11
Nodes (18): InjectRepository, Cinema, Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn (+10 more)

### Community 38 - "RefreshTokenService"
Cohesion: 0.16
Nodes (8): RefreshToken, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, RefreshTokenService, Injectable

### Community 39 - "AdminPeopleController"
Cohesion: 0.20
Nodes (10): AdminPeopleController, ApiOperation, ApiTags, Controller, Delete, Get, HttpCode, Param (+2 more)

### Community 40 - "ShowtimeBaseDto"
Cohesion: 0.19
Nodes (18): BulkCreateShowtimesDto, CreateShowtimeDto, SeatTypePriceDto, ShowtimeBaseDto, ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray (+10 more)

### Community 41 - "CreateMovieDto"
Cohesion: 0.12
Nodes (17): CreateMovieDto, ArrayMaxSize, ArrayUnique, IsArray, IsInt, IsISO8601, IsOptional, IsString (+9 more)

### Community 42 - "admin-people.controller.ts"
Cohesion: 0.18
Nodes (15): AddCreditDto, ReplaceCreditsDto, ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString (+7 more)

### Community 43 - "Role"
Cohesion: 0.12
Nodes (16): Role, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn (+8 more)

### Community 44 - "ScreensService"
Cohesion: 0.26
Nodes (3): ScreenResponseDto, ScreensService, Injectable

### Community 45 - "rbac.service.ts"
Cohesion: 0.23
Nodes (9): SystemRole, Permission, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, RbacModule, Module (+1 more)

### Community 46 - "CreateCinemaDto"
Cohesion: 0.16
Nodes (13): IsLatitude, IsLongitude, IsIanaTimezone(), isIanaTimezone(), CreateCinemaDto, ArrayMaxSize, IsArray, IsEmail (+5 more)

### Community 47 - "CreditResponseDto"
Cohesion: 0.32
Nodes (4): Body, CreditsService, Injectable, CreditResponseDto

### Community 48 - "main.ts"
Cohesion: 0.19
Nodes (8): Catch, AppModule, Module, HttpExceptionFilter, ApiEnvelope, ResponseInterceptor, Injectable, bootstrap()

### Community 49 - "seed.ts"
Cohesion: 0.31
Nodes (10): logger, main(), seedPermissions(), seedRoles(), seedSuperAdmin(), ENTITIES, DEFAULT_ROLE_PERMISSIONS, PermissionCode (+2 more)

### Community 50 - "app.module.ts"
Cohesion: 0.21
Nodes (9): appConfig, databaseConfig, EnvironmentVariables, IsNotEmpty, IsString, MinLength, validateEnv(), AuthModule (+1 more)

### Community 51 - "LocalMediaStorage"
Cohesion: 0.21
Nodes (4): Inject, LocalMediaStorage, Injectable, MediaStorage

### Community 52 - "CreateRoleDto"
Cohesion: 0.22
Nodes (12): AssignRoleDto, CreateRoleDto, SetRolePermissionsDto, ApiProperty, ApiPropertyOptional, ArrayMaxSize, IsArray, IsOptional (+4 more)

### Community 53 - "scripts"
Cohesion: 0.17
Nodes (11): name, private, scripts, build, lint, migration:revert, migration:run, seed (+3 more)

### Community 54 - "PaginationQueryDto"
Cohesion: 0.17
Nodes (11): PaginationQueryDto, IsInt, IsOptional, Max, Min, Type, QueryCinemasDto, IsEnum (+3 more)

### Community 55 - "PeopleController"
Cohesion: 0.27
Nodes (8): PeopleController, ApiOkResponse, ApiOperation, ApiTags, Controller, Get, Param, Query

### Community 56 - "showtime-slots.util.ts"
Cohesion: 0.42
Nodes (8): daysBetweenInclusive(), formatIsoDate(), offsetMinutes(), parseIsoDate(), zonedLocalToUtc(), BulkSlotInput, expandBulkSlots(), parseRange()

### Community 57 - ".list"
Cohesion: 0.24
Nodes (8): CinemasController, ApiOkResponse, ApiOperation, ApiTags, Controller, Get, Param, Query

### Community 58 - "Movie"
Cohesion: 0.18
Nodes (10): Movie, Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne (+2 more)

### Community 59 - "UpdateShowtimePricingDto"
Cohesion: 0.18
Nodes (11): RescheduleShowtimeDto, ArrayMaxSize, IsArray, IsDate, IsInt, IsOptional, Max, Min (+3 more)

### Community 60 - "jest"
Cohesion: 0.20
Nodes (10): jest, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.ts$, js (+2 more)

### Community 61 - "exclude"
Cohesion: 0.20
Nodes (9): dist, node_modules, **/*spec.ts, ./tsconfig.json, exclude, extends, include, src (+1 more)

### Community 62 - "OpaqueTokenGenerator"
Cohesion: 0.29
Nodes (5): CryptoOpaqueTokenGenerator, Injectable, GeneratedToken, OpaqueTokenGenerator, Inject

### Community 63 - "CreateScreenDto"
Cohesion: 0.20
Nodes (10): CreateScreenDto, ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsInt, IsString, Length (+2 more)

### Community 64 - "ScreensController"
Cohesion: 0.22
Nodes (7): ScreensController, ApiOkResponse, ApiOperation, ApiTags, Controller, Get, Param

### Community 65 - "CreatePersonDto"
Cohesion: 0.32
Nodes (8): IsDateString, CreatePersonDto, QueryPeopleDto, IsOptional, IsString, IsUrl, Length, MaxLength

### Community 66 - "AddCinemaImageDto"
Cohesion: 0.25
Nodes (8): AddCinemaImageDto, IsEnum, IsInt, IsOptional, IsUrl, Length, Max, Min

### Community 68 - "ShowtimePricing"
Cohesion: 0.29
Nodes (7): ShowtimePricing, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn

### Community 69 - "nest-cli.json"
Cohesion: 0.40
Nodes (4): collection, compilerOptions, tsConfigPath, sourceRoot

## Knowledge Gaps
- **104 isolated node(s):** `collection`, `sourceRoot`, `tsConfigPath`, `name`, `version` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `JwtUser` connect `JwtUser` to `AdminCinemasController`, `cinemas.service.ts`, `Public`, `showtimes.service.ts`, `UpdateProfileDto`, `Showtime`, `User`, `screens.service.ts`, `ScreensService`, `seat-layouts.service.ts`, `Paginated`, `AdminScreensController`, `auth.service.ts`, `AccessTokenService`, `ShowtimesService`, `CinemasService`, `ShowtimeResponseDto`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Why does `Movie` connect `Movie` to `CurrentUser`, `movie-lifecycle.service.ts`, `admin-movies.controller.ts`, `movies.service.ts`, `MovieCredit`, `showtimes.service.ts`, `movie-relations.service.ts`, `Showtime`, `screens.service.ts`, `movie-query.service.ts`, `movies.module.ts`, `MoviesService`, `ShowtimesService`, `people.service.ts`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `AdminCinemasController`, `Public`, `UpdateProfileDto`, `JwtUser`, `Paginated`, `AdminScreensController`, `auth.service.ts`, `ShowtimeResponseDto`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `Movie` (e.g. with `generateUniqueSlug()` and `lockMovieOrFail()`) actually correct?**
  _`Movie` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `Showtime` (e.g. with `.block()` and `.cancel()`) actually correct?**
  _`Showtime` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `collection`, `sourceRoot`, `tsConfigPath` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CurrentUser` be split into smaller, more focused modules?**
  _Cohesion score 0.07863849765258216 - nodes in this community are weakly interconnected._