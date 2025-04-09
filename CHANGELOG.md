# Change Log

All notable changes to the "@qavajs/steps-accessibility-ea" will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.0]
- :rocket: added capability to provide context of accessibility analysis
```gherkin
And I perform accessibility check:
    """
    {
      "context": "[aria-label*=\"sidebar category 'Steps'\"]"
    }
    """
```

## [0.0.1]
- :rocket: initial implementation
