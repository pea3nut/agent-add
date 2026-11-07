Feature: Inline Markdown names use parsed headings and Unicode characters

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)
    And an isolated project and HOME are created

  @P0
  Scenario: Distinct Chinese headings create distinct non-empty command names
    When inline commands headed 中文命令 and 审查规则 are installed on cursor
    Then both commands succeed and their exact original contents are preserved
    And the target filenames are 中文命令.md and 审查规则.md rather than .md

  @P0
  Scenario: Names preserve accented Cyrillic Arabic and Japanese letters
    When inline commands headed Café Review, Проверка кода, مراجعة الكود and 日本語レビュー are installed separately
    Then their names preserve Unicode letters and use one hyphen between words
    And no command has an empty name or path separator

  @P0
  Scenario: A punctuation-only heading is rejected without an empty target filename
    When inline command # !!! followed by a body is installed
    Then installation fails with a heading-name explanation and no command file is written

  @P1
  Scenario: Markdown syntax is parsed rather than mistaken for a heading
    Given an inline source has a fenced code block containing # Fake followed by a real # **Real** Review heading
    When the command is installed on cursor
    Then the filename is real-review.md and the full original source bytes are preserved
    And a source containing only the fenced heading is rejected without writes
