<?xml version="1.0"?> 
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
<xsl:output method="html" encoding="iso-8859-1" media-type="text/html" />
  <xsl:template match="message">
    <xsl:value-of select="."/>
  </xsl:template>
</xsl:stylesheet>
