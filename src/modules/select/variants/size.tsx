import { Variant as Layout } from '@/layouts/variant';

const Module = () => {
  return (
    <Layout.Main id="select-basic">
      <Layout.Header>Size</Layout.Header>
      <Layout.SubHeader>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s, when an unknown printer took a galley of type and
        scrambled it to make a type specimen book.
      </Layout.SubHeader>
      <Layout.Example>
        <punica-row gap={16}>
          <punica-col>
            <punica-select
              size="small"
              value="item3"
              placeholder="Lorem Ipsum..."
            >
              <punica-select-item value="item1">Item 1</punica-select-item>
              <punica-select-item value="item2">Item 2</punica-select-item>
              <punica-select-item value="item3">Item 3</punica-select-item>
              <punica-select-item value="item4">Item 4</punica-select-item>
              <punica-select-item value="item5">Item 5</punica-select-item>
              <punica-select-item value="item6">Item 6</punica-select-item>
              <punica-select-item value="item7">Item 7</punica-select-item>
              <punica-select-item value="item8">Item 8</punica-select-item>
              <punica-select-item value="item9">Item 9</punica-select-item>
              <punica-select-item value="item10">Item 10</punica-select-item>
              <punica-icon slot="caret">
                <i className="fa-solid fa-caret-down" />
              </punica-icon>
            </punica-select>
          </punica-col>
          <punica-col>
            <punica-select
              size="medium"
              value="item3"
              placeholder="Lorem Ipsum..."
            >
              <punica-select-item value="item1">Item 1</punica-select-item>
              <punica-select-item value="item2">Item 2</punica-select-item>
              <punica-select-item value="item3">Item 3</punica-select-item>
              <punica-select-item value="item4">Item 4</punica-select-item>
              <punica-select-item value="item5">Item 5</punica-select-item>
              <punica-select-item value="item6">Item 6</punica-select-item>
              <punica-select-item value="item7">Item 7</punica-select-item>
              <punica-select-item value="item8">Item 8</punica-select-item>
              <punica-select-item value="item9">Item 9</punica-select-item>
              <punica-select-item value="item10">Item 10</punica-select-item>
              <punica-icon slot="caret">
                <i className="fa-solid fa-caret-down" />
              </punica-icon>
            </punica-select>
          </punica-col>
          <punica-col>
            <punica-select
              size="large"
              value="item3"
              placeholder="Lorem Ipsum..."
            >
              <punica-select-item value="item1">Item 1</punica-select-item>
              <punica-select-item value="item2">Item 2</punica-select-item>
              <punica-select-item value="item3">Item 3</punica-select-item>
              <punica-select-item value="item4">Item 4</punica-select-item>
              <punica-select-item value="item5">Item 5</punica-select-item>
              <punica-select-item value="item6">Item 6</punica-select-item>
              <punica-select-item value="item7">Item 7</punica-select-item>
              <punica-select-item value="item8">Item 8</punica-select-item>
              <punica-select-item value="item9">Item 9</punica-select-item>
              <punica-select-item value="item10">Item 10</punica-select-item>
              <punica-icon slot="caret">
                <i className="fa-solid fa-caret-down" />
              </punica-icon>
            </punica-select>
          </punica-col>
        </punica-row>
      </Layout.Example>
      <Layout.Code>{Code}</Layout.Code>
    </Layout.Main>
  );
};

const Code = `
  <punica-select size="small" value="item3" placeholder="Lorem Ipsum...">
    <punica-select-item value="item1">Item 1</punica-select-item>
    <punica-select-item value="item2">Item 2</punica-select-item>
    <punica-select-item value="item3">Item 3</punica-select-item>
    <punica-select-item value="item4">Item 4</punica-select-item>
    <punica-select-item value="item5">Item 5</punica-select-item>
    <punica-select-item value="item6">Item 6</punica-select-item>
    <punica-select-item value="item7">Item 7</punica-select-item>
    <punica-select-item value="item8">Item 8</punica-select-item>
    <punica-select-item value="item9">Item 9</punica-select-item>
    <punica-select-item value="item10">
        Item 10
    </punica-select-item>
    <punica-icon slot="caret">
        <i className="fa-solid fa-caret-down" />
    </punica-icon>
  </punica-select>
`;

export default Module;
