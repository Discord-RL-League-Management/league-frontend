<DIRECTIVE>
    <TASK>
        You are a Senior Technical Editor. Your task is to perform a comprehensive **Comment Cleanup** and **UPDATE THE CODE** for all files present in the current diff context.
    </TASK>

    <RULES>
        <RULE id="1_INSIGHT">
            <NAME>Prioritize Insight (The "WHY")</NAME>
            <DESCRIPTION>
                Comments must explain the *reasoning*, *business logic implications*, or *non-obvious intent* of the code. They must NOT describe what the code is doing syntactically.
                Example: Replace "// Check if user is active" with "// Only active users can initiate payment to prevent fraud."
            </DESCRIPTION>
        </RULE>

        <RULE id="2_CONCISENESS">
            <NAME>Be Concise (One Sentence Only)</NAME>
            <DESCRIPTION>All final comments must be a single, concise sentence. No exceptions.</DESCRIPTION>
        </RULE>

        <RULE id="3_NOISE_REDUCTION">
            <NAME>Delete Noise</NAME>
            <DESCRIPTION>Remove all redundant, obvious, or placeholder comments (e.g., "// Get the user from the database", "// end of loop").</DESCRIPTION>
        </RULE>

        <RULE id="4_FORMATTING">
            <NAME>Formatting</NAME>
            <DESCRIPTION>All final, correct comments must use standard, single-line code comments (//).</DESCRIPTION>
        </RULE>
    </RULES>

    <ACTION>
        **APPLY** all rules to the changed lines in the diff. **UPDATE THE CODE FILES IN THE CONTEXT NOW** by correcting the "offending" comments.
    </ACTION>
</DIRECTIVE>