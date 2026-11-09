# npm trusted publishing

The `Publish to npm` workflow (`.github/workflows/publish.yml`) binds a package
version to a GitHub tag, commit and public workflow run using npm's OIDC trusted
publishing and provenance. It does not use an `NPM_TOKEN` secret.

**Maintainer setup below is required before the first release.** The workflow
references an environment; it cannot configure that environment's approval rules
or the npm account's trusted publisher. Version **1.3.0 was published manually**
and has no npm provenance attestation. This setup applies to future versions;
it does not retroactively attest 1.3.0.

## One-time setup, in this order

1. Merge the publishing PR into `master`.
2. In GitHub, open **pea3nut/agent-add → Settings → Environments** and create
   **`npm-publish`**:
   - Add a required reviewer who can approve releases.
   - If you are the only reviewer and also push release tags, leave **Prevent
     self-review** off. Enable it only when a different reviewer is available.
   - Under deployment branches and tags, select **Selected branches and tags**
     and allow **tags** matching **`[0-9]*`**. Do not add branch rules.
   - Ensure repository/organization policy permits this workflow and its OIDC
     permission. Do not add an npm token to the environment.
3. On [npm's agent-add package page](https://www.npmjs.com/package/agent-add),
   open **Settings → Trusted Publisher → GitHub Actions** and enter:

   | Field | Value |
   | --- | --- |
   | Organization or user | `pea3nut` |
   | Repository | `agent-add` |
   | Workflow filename | `publish.yml` (filename only) |
   | Environment name | `npm-publish` |
   | Allowed actions, if shown | Allow direct `npm publish`; separate dist-tag management is not needed |

4. Enable account 2FA, revoke obsolete npm publishing tokens, and remove any
   obsolete `NPM_TOKEN`/`NODE_AUTH_TOKEN` secrets. Adding a trusted publisher does
   not automatically disable other publishing methods or revoke old tokens.
5. Recommended: protect `master` and create a tag ruleset restricting updates
   and deletions of version tags. Require review for publishing workflow changes.

The workflow pins its GitHub Actions to full commit IDs and uses Node 24.22.2
with npm 11.9.0 for publishing. These meet npm's trusted-publishing requirements;
the installed CLI still supports Node 18. Only the `publish` job has
`id-token: write`; its GitHub environment rules must be configured on the website.

## Release a new version

1. Change both `package.json` and `package-lock.json` to a new stable version
   through a PR. Merge it into `master`. Do not reuse a published version.
2. Tag that exact merged commit. Existing naming is **`1.3.1`**, not `v1.3.1`.
   For example, after the version PR is merged:

   ```bash
   git fetch origin master
   git tag -a 1.3.1 origin/master -m 'Release agent-add 1.3.1'
   git push origin refs/tags/1.3.1
   ```

   Substitute the actual new version. The workflow verifies the tag version,
   package name/repository, checkout SHA and ancestry in `master`. Tags from
   unmerged branches, branch-based dispatches and prerelease versions are rejected.
3. In **Actions → Publish to npm**, inspect the build and packed runtime checks,
   then approve the **`npm-publish`** environment deployment.
4. Wait for **Verify npm archive and attestations** to pass. Then prepare the
   GitHub Release as usual. The workflow does not publish a GitHub Release.

The sequence is:

`validate tag → build and pack once → test that tarball on Node 18–24 → environment approval → OIDC publish that tarball → download from npm and verify`

The privileged publish job does not check out or run repository scripts. It
checks the tarball identity and SHA-512 again and uses `npm publish <tarball>
--ignore-scripts --provenance`. It does not rebuild after the runtime tests.
The final read-only job checks npm's tarball against the original SHA-512,
requires provenance matching the archive digest, repository, workflow, tag and
exact commit, installs it with lifecycle scripts disabled and
runs `npm audit signatures` to cryptographically verify registry signatures
and attestations. It never launches the installed agent-add CLI.

## Inspect the evidence

- The workflow run is public and reports the source commit and npm attestation URL.
- `npm-release` contains the tested `.tgz` and `release.json` (version, commit,
  repository and SHA-512). Artifact retention is 30 days.
- `npm-release-verification` contains the receipt, registry verification metadata
  and signature verification output. Artifact retention is 90 days. Download
  access may require GitHub sign-in; retain desired evidence with your Release.
- npm's package page exposes its provenance link. Check that it identifies
  `pea3nut/agent-add`, the release commit and `.github/workflows/publish.yml`.

Provenance establishes the package's source/build identity; it is not an audit
that proves absence of malicious behavior. Independent reproducible builds and
behavioral auditing are separate work.

## Recovery and local checks

- Missing npm configuration/OIDC authorization: complete the setup, then rerun
  failed jobs for the same tag. Do not fall back to a long-lived publishing token.
- If npm publishing succeeded but final verification failed, the version is
  already public. Rerun only the failed verification job after investigating.
  A failed final check does not undo npm publication; do not move the tag or
  attempt to overwrite the version.
- GitHub's manual **Run workflow** must use a tag ref. CLI alternative:
  `gh workflow run publish.yml --ref 1.3.1`. Dispatching from `master` is rejected.
- `npm run test:release` exercises valid and invalid Git/tag/archive/registry
  cases without publishing. Normal CI runs these guards on every PR.

References: [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/)
and [npm provenance](https://docs.npmjs.com/generating-provenance-statements/).
