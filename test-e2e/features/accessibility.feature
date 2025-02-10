Feature: Accessibility

  Scenario: perform accessibility check
    When I open 'https://qavajs.github.io/' url
    And I perform accessibility check:
    """
    {
      "outputFormat": ["json", "html"],
      "failLevels": []
    }
    """

  Scenario: perform accessibility check and save results
    When I open 'https://qavajs.github.io/' url
    And I perform accessibility check and save results as 'report':
    """
    {
      "outputFormat": ["json", "html"]
    }
    """
    Then I expect '$report.summary.counts.violation' greater than '0'

