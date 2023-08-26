# Plugin Layout - Table imports prettier plugin
##### Import sorting now included 🎉

### Turn this
```ts
import React, { useState, useCallback } from 'react'
import { useSomeLogic, configurate } from 'pkg'
import * as lodash from 'lodash'
import { writeFile, readFile, readdir } from 'node:fs'
import type { ButtonProps } from './button.interface'
import type { InputProps } from './input.interface'
import { type FC } from 'react'
```
### Into this
```ts
import      React            from 'react'
import      { useCallback }  from 'react'
import      { useState }     from 'react'
import type { FC }           from 'react'

import      { readdir }      from 'node:fs'
import      { readFile }     from 'node:fs'
import      { writeFile }    from 'node:fs'

import      * as lodash      from 'lodash'
import      { configurate }  from 'pkg'
import      { useSomeLogic } from 'pkg'

import type { ButtonProps }  from './button.interface'
import type { InputProps }   from './input.interface'
```

## Installation
*soon*

## Import sorting configuration
*soon*
