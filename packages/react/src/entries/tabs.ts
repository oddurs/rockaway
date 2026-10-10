// `@rockaway/react/tabs`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export {
  layoutTabs,
  type TabsBufferOptions,
  type TabsLayout,
  tabsBuffer,
  tabsText,
} from '../components/tabs.pure.ts';
export {
  Tab,
  TabList,
  type TabListProps,
  TabPanel,
  type TabPanelProps,
  type TabProps,
  Tabs,
  type TabsProps,
} from '../components/tabs.tsx';
