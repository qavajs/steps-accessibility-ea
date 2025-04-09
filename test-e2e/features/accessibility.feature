Feature: Accessibility

  Scenario Outline: perform accessibility check <url>
    When I open '<url>' url
    And I perform accessibility check:
    """
    {
      "outputFormat": ["json", "html"],
      "failLevels": [],
      "reportLevels": [
        "violation",
        "potentialviolation",
        "recommendation",
        "potentialrecommendation",
        "manual",
        "pass"
      ]
    }
    """
    Examples:
      | url                                 |
      | https://qavajs.github.io/docs/intro |

  Scenario: perform accessibility check and save results
    When I open 'https://qavajs.github.io/docs/intro' url
    And I perform accessibility check and save results as 'report':
    """
    {
      "outputFormat": ["json", "html"]
    }
    """
    Then I expect '$report.summary.counts.violation' greater than '0'

  Scenario Outline: perform accessibility check for certain element
    When I open '<url>' url
    And I perform accessibility check:
    """
    {
      "context": "[aria-label*=\"sidebar category 'Steps'\"]",
      "outputFormat": ["json", "html"],
      "failLevels": [],
      "reportLevels": [
        "violation",
        "potentialviolation",
        "recommendation",
        "potentialrecommendation",
        "manual",
        "pass"
      ]
    }
    """
    Examples:
      | url                                 |
      | https://qavajs.github.io/docs/intro |

