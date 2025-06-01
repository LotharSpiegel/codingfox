+++
title = 'IntellijTroubleshooting'
description = 'A collection of solutions to some annoying problems in IntelliJ.'
date = 2025-02-10T09:36:35+01:00
draft = true
wip = true
+++

## Find IntelliJ settings folder
Help > Show Log in Explorer
will bring you to your local IntelliJ folder

## Slow debug mode
If you disable the following options in Build, Execution, Deployment -> Debugger -> Data Views --> Java, debugging could run faster again.
- Enable alternative view for Collection classes
- Enable 'toString()' object view: