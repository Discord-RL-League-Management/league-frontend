<DIRECTIVE>
    <TASK>
        BugBot should perform critical differential audits on pull requests, focusing exclusively on identifying high-impact defects in new or modified code. Analyze only code changes in the diff.
    </TASK>

    <SECURITY_RISKS>
        <PRIORITY>HIGHEST</PRIORITY>
        
        <RULE id="hardcoded_secrets">
            <NAME>Hardcoded Secrets</NAME>
            <CHECK>Search for API keys, database credentials, JWT secrets, passwords, or tokens</CHECK>
            <REQUIREMENT>All secrets must use ConfigService to load from environment variables</REQUIREMENT>
            <EXCEPTION>Test fixtures with clearly marked test-only credentials</EXCEPTION>
        </RULE>

        <RULE id="injection_risks">
            <NAME>Injection Risks</NAME>
            <CHECK>Raw, unsanitized user input in: database queries, email content, log messages, file operations</CHECK>
            <REQUIREMENT>All user input must be validated through DTOs with class-validator decorators. Use Prisma parameterized queries.</REQUIREMENT>
        </RULE>

        <RULE id="missing_guards">
            <NAME>Missing Guards/Permissions</NAME>
            <CHECK>New controller endpoints without authentication guards</CHECK>
            <REQUIREMENT>Protected routes MUST have @UseGuards(JwtAuthGuard) unless explicitly marked with @Public() decorator</REQUIREMENT>
            <REQUIREMENT>Public routes (health checks, OAuth callbacks) must use @Public() decorator for clarity</REQUIREMENT>
        </RULE>
    </SECURITY_RISKS>

    <RELIABILITY_RISKS>
        <RULE id="race_conditions">
            <NAME>Race Conditions (Data Consistency)</NAME>
            <PATTERN>read -> check -> write database operations without transactions</PATTERN>
            <REQUIREMENT>Multi-step database updates must use Prisma transactions</REQUIREMENT>
            <EXAMPLE_FLAG>const data = await repo.find(); ... await repo.update(data)</EXAMPLE_FLAG>
        </RULE>

        <RULE id="resource_leaks">
            <NAME>Resource Leakage</NAME>
            <CHECK>Unclosed file streams, database connections, HTTP clients</CHECK>
            <REQUIREMENT>All resources (fs.createReadStream, new Client()) must have corresponding cleanup logic</REQUIREMENT>
            <REQUIREMENT>Lifecycle hooks (OnModuleDestroy) must properly clean up resources</REQUIREMENT>
        </RULE>

        <RULE id="unhandled_async">
            <NAME>Unhandled Async Operations</NAME>
            <REQUIREMENT>All async functions must be properly awaited</REQUIREMENT>
            <REQUIREMENT>Promises called without await must have .catch() handlers</REQUIREMENT>
        </RULE>

        <RULE id="n_plus_one">
            <NAME>N+1 Database Queries</NAME>
            <PATTERN>Queries executed inside loops</PATTERN>
            <REQUIREMENT>Prefer Prisma include relations or batch queries</REQUIREMENT>
            <EXAMPLE_FLAG>for (const item of items) { await db.query(item.id); }</EXAMPLE_FLAG>
        </RULE>

        <RULE id="blocking_io">
            <NAME>Blocking Synchronous I/O</NAME>
            <CHECK>fs.readFileSync, fs.writeFileSync, or other blocking synchronous operations</CHECK>
            <REQUIREMENT>Use async alternatives: fs.promises.readFile()</REQUIREMENT>
        </RULE>


    </RELIABILITY_RISKS>

    <CODE_QUALITY_VIOLATIONS>
        <RULE id="circular_deps">
            <NAME>Circular Dependencies</NAME>
            <CHECK>New module imports creating circular dependencies (A → B → A)</CHECK>
            <REQUIREMENT>Use forwardRef() only when absolutely necessary. Prefer refactoring.</REQUIREMENT>
        </RULE>

        <RULE id="error_mapping">
            <NAME>Improper Error Mapping</NAME>
            <REQUIREMENT>Low-level errors (Prisma, database) must not be re-thrown directly</REQUIREMENT>
            <REQUIREMENT>Map to appropriate HttpException subclasses (NotFoundException, BadRequestException)</REQUIREMENT>
            <REQUIREMENT>Do not expose internal error details to clients</REQUIREMENT>
        </RULE>

        <RULE id="state_contamination">
            <NAME>Race Condition (State Contamination)</NAME>
            <PATTERN>Singleton service instance properties mutated during request lifecycle</PATTERN>
            <REQUIREMENT>Use request-scoped services or request context objects instead</REQUIREMENT>
            <EXAMPLE_FLAG>private tempData: any; mutated in request handlers</EXAMPLE_FLAG>
        </RULE>

        <RULE id="magic_strings">
            <NAME>Magic Strings/Numbers</NAME>
            <CHECK>String/number literals for cache keys, event names, configuration</CHECK>
            <REQUIREMENT>Must be exported constants</REQUIREMENT>
            <EXCEPTION>HTTP status codes, standard enum values</EXCEPTION>
            <EXAMPLE>'user.created' should be export const USER_CREATED_EVENT = 'user.created'</EXAMPLE>
        </RULE>

        <RULE id="http_status_codes">
            <NAME>Incorrect HTTP Status Codes</NAME>
            <REQUIREMENT>GET: 200 (or 404 if not found)</REQUIREMENT>
            <REQUIREMENT>POST: 201 (created) or 200 (if not creating)</REQUIREMENT>
            <REQUIREMENT>PUT/PATCH: 200 or 204</REQUIREMENT>
            <REQUIREMENT>DELETE: 200 or 204</REQUIREMENT>
        </RULE>

        <RULE id="typescript_types">
            <NAME>TypeScript Type Safety</NAME>
            <REQUIREMENT>Guards overriding canActivate() must explicitly type: boolean | Promise<boolean></REQUIREMENT>
            <REQUIREMENT>Avoid any types - use proper TypeScript types or unknown</REQUIREMENT>
            <REQUIREMENT>All async methods should have proper return types</REQUIREMENT>
        </RULE>

        <RULE id="linter_errors">
            <NAME>Linter/Compilation Errors</NAME>
            <CHECK>Ensure code compiles without TypeScript errors and passes linter checks</CHECK>
            <REQUIREMENT>All code must pass 'npm run lint' and 'tsc --noEmit' before review</REQUIREMENT>
        </RULE>
    </CODE_QUALITY_VIOLATIONS>

    <NESTS_SPECIFIC_PATTERNS>
        <PATTERN id="settings_not_relations">
            <NAME>Settings Are Not Prisma Relations</NAME>
            <REQUIREMENT>Guild settings must be fetched separately via GuildSettingsService.getSettings()</REQUIREMENT>
            <REQUIREMENT>Cannot be accessed from membership.guild.settings - not a Prisma relation</REQUIREMENT>
            <FLAG>Code that tries to access settings through relations</FLAG>
        </PATTERN>

        <PATTERN id="dependency_injection">
            <NAME>Dependency Injection</NAME>
            <REQUIREMENT>All services must use constructor injection</REQUIREMENT>
            <REQUIREMENT>No direct instantiation: new Service()</REQUIREMENT>
            <REQUIREMENT>Use @Inject() for tokens, forwardRef() only when necessary</REQUIREMENT>
        </PATTERN>

        <PATTERN id="error_handling">
            <NAME>Error Handling</NAME>
            <REQUIREMENT>Controllers should not catch errors - let exception filters handle them</REQUIREMENT>
            <REQUIREMENT>Services should throw appropriate HttpException subclasses</REQUIREMENT>
            <REQUIREMENT>Prisma errors must be caught and mapped in service layer or filters</REQUIREMENT>
        </PATTERN>
    </NESTS_SPECIFIC_PATTERNS>
</DIRECTIVE>