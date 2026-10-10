import { Tab, TabList, TabPanel, Tabs } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <Tabs cols={34} rows={5}>
      <TabList aria-label="Settings">
        <Tab id="general">General</Tab>
        <Tab id="keys">Keys</Tab>
        <Tab id="themes">Themes</Tab>
      </TabList>
      <TabPanel id="general">Name, email and avatar.</TabPanel>
      <TabPanel id="keys">Every shortcut, and what it does.</TabPanel>
      <TabPanel id="themes">Sunset, paper and ink.</TabPanel>
    </Tabs>
  );
}
