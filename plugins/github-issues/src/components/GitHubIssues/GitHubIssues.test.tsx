/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import {
  EntityProvider,
  catalogApiRef,
  CatalogApi,
} from '@backstage/plugin-catalog-react';

import { generateTestIssue } from '../../utils';
import { GitHubIssuesApi, gitHubIssuesApiRef } from '../../api';

import { GitHubIssues } from './GitHubIssues';
import { Entity } from '@backstage/catalog-model';

jest
  .useFakeTimers()
  .setSystemTime(new Date('2020-04-20T08:15:47.614Z').getTime());

const entityComponent = {
  metadata: {
    annotations: {
      'github.com/project-slug': 'backstage/backstage',
    },
    name: 'backstage',
  },
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
} as unknown as Entity;

const mockCatalogApi = {
  getEntities: () => ({}),
} as CatalogApi;

describe('GitHubIssues', () => {
  it('should render correctly when there are no issues in GitHub', async () => {
    const mockApi = {
      fetchIssuesByRepoFromGitHub: async () => ({
        backstage: {
          issues: {
            totalCount: 0,
            edges: [],
          },
        },
      }),
    } as GitHubIssuesApi;

    const apis = [
      [gitHubIssuesApiRef, mockApi],
      [catalogApiRef, mockCatalogApi],
    ] as const;

    const { getByTestId } = await renderInTestApp(
      <TestApiProvider apis={apis}>
        <EntityProvider entity={entityComponent}>
          <GitHubIssues />
        </EntityProvider>
      </TestApiProvider>,
    );

    expect(getByTestId('no-issues-msg')).toHaveTextContent(
      'Hurray! No Issues 🚀',
    );
  });

  it('should render correctly', async () => {
    const testIssue = generateTestIssue({
      createdAt: '2020-04-19T10:15:47.614Z',
      updatedAt: '2020-04-20T00:15:47.614Z',
    });

    const mockApi = {
      fetchIssuesByRepoFromGitHub: async () => ({
        backstage: {
          issues: {
            totalCount: 1,
            edges: [testIssue],
          },
        },
      }),
    } as GitHubIssuesApi;
    const apis = [
      [gitHubIssuesApiRef, mockApi],
      [catalogApiRef, mockCatalogApi],
    ] as const;

    const { getByText, getByTestId } = await renderInTestApp(
      <TestApiProvider apis={apis}>
        <EntityProvider entity={entityComponent}>
          <GitHubIssues />
        </EntityProvider>
      </TestApiProvider>,
    );

    getByText('All repositories (1 Issue)');

    expect(getByTestId(`issue-${testIssue.node.url}`)).toHaveTextContent(
      testIssue.node.title,
    );

    expect(getByTestId(`issue-${testIssue.node.url}`)).toHaveTextContent(
      testIssue.node.repository.nameWithOwner,
    );

    expect(getByTestId(`issue-${testIssue.node.url}`)).toHaveTextContent(
      `Created at: 22 hours ago by ${testIssue.node.author.login}`,
    );

    expect(getByTestId(`issue-${testIssue.node.url}`)).toHaveTextContent(
      `Last update at: 8 hours ago`,
    );
  });
});
