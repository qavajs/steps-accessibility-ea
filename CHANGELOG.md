# Change Log

All notable changes to the "@qavajs/steps-accessibility-ea" will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

:rocket: - new feature  
:beetle: - bugfix  
:x: - deprecation/removal  
:pencil: - chore  
:microscope: - experimental

## [2.1.0]
- :rocket: added self-contained html report that is attached to each accessibility check step
- :beetle: fixed config override when steps are loaded via tsx (step options no longer leak between checks)
- :beetle: added `executeAsync` polyfill to support WebdriverIO v10
- :pencil: updated dependencies
- :pencil: replaced jest with vitest, added unit tests for html report
- :pencil: updated to TypeScript 7, split tsconfig into type-check and build configs

## [2.0.0]
- :rocker: release

## [0.1.1]
- :pencil: updated dependencies
- :pencil: replaced jest with vitest, added unit tests for html report
- :pencil: updated to TypeScript 7, split tsconfig into type-check and build configs

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
