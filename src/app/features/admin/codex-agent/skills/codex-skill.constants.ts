import { CodexSkillCreateDto } from '../../../../core/models/codex-agent/codex-skill.model';

export const CODEX_SKILL_ROUTES = {
  list: '/admin/codex-agent/skills',
  create: '/admin/codex-agent/skills/create'
} as const;

export const CODEX_SKILL_INITIAL_VALUE: CodexSkillCreateDto = {
  code: '',
  name: '',
  description: '',
  files: [
    {
      path: 'SKILL.md',
      content: '# Skill\n\nDescribe when to use this skill and the exact workflow it enforces.',
      contentType: 'markdown'
    }
  ],
  enabled: true,
  status: 'ACTIVE'
};
