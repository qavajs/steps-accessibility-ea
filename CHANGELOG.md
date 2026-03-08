# Change Log

All notable changes to the "@qavajs/steps-accessibility-ea" will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

:rocket: - new feature  
:beetle: - bugfix  
:x: - deprecation/removal  
:pencil: - chore  
:microscope: - experimental

## [2.0.0]
- :rocker: release

## [0.1.1]
- :pencil: updated dependencies

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
