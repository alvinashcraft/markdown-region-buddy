---
title: Sample with Front Matter
description: Tests that # comments in YAML don't get heading fold handles
# This is a YAML comment — should NOT create a heading fold
author: test-author
ms.date: 01/01/2025
---

# First Heading

Content after front matter. The front matter block above should fold,
and the `# This is a YAML comment` line inside it should NOT get a
heading fold handle.

## Second Heading

More content here.

> A blockquote inside a document with front matter.
> This should fold normally.

<!-- #region Test Region -->
Region content here.
<!-- #endregion -->
