<DIRECTIVE>
    <TASK>
        You are a Senior DevOps Engineer tasked with automating the entire Pull Request (PR) lifecycle for the current branch. This process includes creating the PR, ensuring all checks pass, fixing failures, and finalizing the merge and cleanup.
    </TASK>

    <PR_WORKFLOW>
        <PHASE_1_COMMIT_AND_OPEN>
            <ACTION>
                Execute the Conventional Commit prompt (from the previous directive) to commit all staged changes.
            </ACTION>
            <ACTION>
                Execute the GitHub CLI command to open a new PR, using the last generated commit message as the PR title.
            </ACTION>
            <COMMAND_FORMAT>
                gh pr create --web --title "[LAST_COMMIT_SUBJECT]" --body "[LAST_COMMIT_BODY]"
            </COMMAND_FORMAT>
        </PHASE_1_COMMIT_AND_OPEN>

        <PHASE_2_VALIDATION_AND_FIX_LOOP>
            <ACTION>
                Continuously monitor the PR status for required checks.
            </ACTION>
            <COMMAND_FORMAT>
                gh pr checks [CURRENT_BRANCH_NAME]
            </COMMAND_FORMAT>
            <FIX_LOOP_CRITERIA>
                <CRITERIA>If any check status is 'FAILURE' or 'ERROR', the LLM MUST immediately proceed to the failure analysis stage.</CRITERIA>
                <CRITERIA>If all required checks have passed, proceed to PHASE_3_MERGE.</CRITERIA>
            </FIX_LOOP_CRITERIA>

            <FAILURE_ANALYSIS>
                <ACTION>
                    Review the logs and code associated with the failing check (e.g., CI, Lint, Test).
                </ACTION>
                <ACTION>
                    If the cause of the failure is unclear (e.g., non-obvious CI error, dependency issue), the LLM MUST use the **Google Search tool** to research the specific error message and context before attempting a fix.
                </ACTION>
                <ACTION>
                    Apply the necessary code fixes to the local branch.
                </ACTION>
                <ACTION>
                    Re-commit the fix using a conventional commit (`fix(scope): resolve failing CI check`) and push the changes to update the PR.
                </ACTION>
                <ACTION>
                    Return to the start of PHASE_2_VALIDATION_AND_FIX_LOOP to monitor the new checks.
                </ACTION>
            </FAILURE_ANALYSIS>
        </PHASE_2_VALIDATION_AND_FIX_LOOP>

        <PHASE_3_MERGE_AND_CLEANUP>
            <ACTION>
                Once all checks pass, perform a **Squash and Merge** operation via the GitHub CLI.
            </ACTION>
            <COMMAND_FORMAT>
                gh pr merge --squash --delete-branch [CURRENT_BRANCH_NAME]
            </COMMAND_FORMAT>
            <CLEANUP>
                <ACTION>After merging, delete the local work branch.</ACTION>
                <COMMAND_FORMAT>
                    git switch [MAIN_BRANCH_NAME] && git branch -D [CURRENT_BRANCH_NAME]
                </COMMAND_FORMAT>
            </CLEANUP>
        </PHASE_3_MERGE_AND_CLEANUP>
    </PR_WORKFLOW>

    <ACTION>
        **EXECUTE** the PR Workflow immediately for the current branch.
    </ACTION>
</DIRECTIVE>
