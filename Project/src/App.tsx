import React, { useState } from 'react';
import Header from './components/Header';
import ProjectList from './components/ProjectList';
import EvaluationView from './components/EvaluationView';
import { Project, Bridge } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'projects' | 'evaluation'>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBridge, setSelectedBridge] = useState<Bridge | null>(null);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: '호남고철 내진성능평가',
      description: '호남고철의 내진성능 검토',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      status: 'active',
      bridges: [
        {
          id: 'b1',
          name: '화실교',
          description: '화실교 메인 구간',
          type: 'concrete',
          length: 280,
          width: 35
        }
      ]
    },
    {
      id: '2',
      name: '성수대교 안전성 평가',
      description: '성수대교의 현재 내진성능 평가 및 개선방안 도출',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
      status: 'completed',
      bridges: [
        {
          id: 'b3',
          name: '성수대교',
          description: '성수대교 전체 구간',
          type: 'steel',
          length: 1160,
          width: 22
        }
      ]
    },
    {
      id: '3',
      name: '잠실대교 신설 검토',
      description: '잠실대교 신설을 위한 내진설계 기준 검토',
      createdAt: '2024-01-22',
      updatedAt: '2024-01-22',
      status: 'draft',
      bridges: [
        {
          id: 'b4',
          name: '잠실대교 1구간',
          description: '잠실대교 북단 구간',
          type: 'composite',
          length: 800,
          width: 30
        },
        {
          id: 'b5',
          name: '잠실대교 2구간',
          description: '잠실대교 남단 구간',
          type: 'composite',
          length: 750,
          width: 30
        }
      ]
    }
  ]);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setSelectedBridge(project.bridges[0] || null);
    setCurrentView('evaluation');
  };

  const handleBridgeSelect = (bridge: Bridge) => {
    setSelectedBridge(bridge);
  };

  const handleProjectCreate = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      bridges: []
    };
    setProjects([...projects, newProject]);
  };

  const handleProjectDelete = (projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId));
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
      setSelectedBridge(null);
      setCurrentView('projects');
    }
  };

  const handleNavigate = (view: 'projects' | 'evaluation') => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentView={currentView}
        onNavigate={handleNavigate}
      />
      
      <main className="flex-1" style={{ height: 'calc(100vh - 64px)' }}>
        {currentView === 'projects' ? (
          <ProjectList 
            projects={projects}
            onProjectSelect={handleProjectSelect}
            onProjectCreate={handleProjectCreate}
            onProjectDelete={handleProjectDelete}
          />
        ) : selectedProject ? (
          <EvaluationView 
            project={selectedProject} 
            selectedBridge={selectedBridge}
            projects={projects}
            onProjectChange={setSelectedProject}
            onBridgeChange={handleBridgeSelect}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">프로젝트를 선택해주세요.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;