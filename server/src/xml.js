import he from "he";

export function buildProductTitleXML({ sellerId, rows }) {
  const msgs = rows
    .map((r, i) => {
      const sku = String(r.sku || "").trim();
      const title = String(r.title || "").trim();
      if (!sku || !title) return "";
      return `<Message>
            <MessageId>${i + 1}</MessageId>
            <OperationType>PartialUpdate</OperationType>
            <Product>
                <SKU>${escapeXML(sku)}</SKU>
                <DescriptionData>
                    <Title><![CDATA[${escapeXML(title)}]]></Title>
                </DescriptionData>
            </Product>
        </Message>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
  <Header>
    <DocumentVersion>1.01</DocumentVersion>
    <MerchantIdentifier>${escapeXml(sellerId)}</MerchantIdentifier>
  </Header>
  <MessageType>Product</MessageType>
${msgs}
</AmazonEnvelope>`;
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
