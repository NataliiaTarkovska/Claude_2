"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, LogOut, FolderOpen, ChevronDown, Pencil, Trash2, Check, X } from "lucide-react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { signOut } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import { updateProject } from "@/actions/update-project";
import { deleteProject } from "@/actions/delete-project";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface HeaderActionsProps {
  user?: {
    id: string;
    email: string;
  } | null;
  projectId?: string;
}

interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export function HeaderActions({ user, projectId }: HeaderActionsProps) {
  const router = useRouter();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Load projects initially
  useEffect(() => {
    if (user && projectId) {
      getProjects()
        .then(setProjects)
        .catch(console.error)
        .finally(() => setInitialLoading(false));
    }
  }, [user, projectId]);

  // Refresh projects when popover opens
  useEffect(() => {
    if (user && projectsOpen) {
      getProjects().then(setProjects).catch(console.error);
    }
  }, [projectsOpen, user]);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentProject = projects.find((p) => p.id === projectId);

  const handleSignInClick = () => {
    setAuthMode("signin");
    setAuthDialogOpen(true);
  };

  const handleSignUpClick = () => {
    setAuthMode("signup");
    setAuthDialogOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const startRename = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(project.id);
    setRenameValue(project.name);
    setTimeout(() => renameInputRef.current?.focus(), 0);
  };

  const commitRename = async () => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    await updateProject(renamingId, renameValue.trim());
    setProjects((prev) =>
      prev.map((p) => (p.id === renamingId ? { ...p, name: renameValue.trim() } : p))
    );
    setRenamingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (id === projectId) {
      router.push("/");
    }
  };

  const handleNewDesign = async () => {
    const project = await createProject({
      name: `Design #${~~(Math.random() * 100000)}`,
      messages: [],
      data: {},
    });
    router.push(`/${project.id}`);
  };

  if (!user) {
    return (
      <>
        <div className="flex gap-2">
          <Button variant="outline" className="h-8" onClick={handleSignInClick}>
            Sign In
          </Button>
          <Button className="h-8" onClick={handleSignUpClick}>
            Sign Up
          </Button>
        </div>
        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          defaultMode={authMode}
        />
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!initialLoading && (
        <Popover open={projectsOpen} onOpenChange={setProjectsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 gap-2" role="combobox">
              <FolderOpen className="h-4 w-4" />
              {currentProject ? currentProject.name : "Select Project"}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="end">
            <Command>
              <CommandInput
                placeholder="Search projects..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>No projects found.</CommandEmpty>
                <CommandGroup>
                  {filteredProjects.map((project) => (
                    <CommandItem
                      key={project.id}
                      value={project.name}
                      onSelect={() => {
                        if (renamingId === project.id) return;
                        router.push(`/${project.id}`);
                        setProjectsOpen(false);
                        setSearchQuery("");
                      }}
                      className="group flex items-center justify-between gap-2"
                    >
                      {renamingId === project.id ? (
                        <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            ref={renameInputRef}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename();
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            className="h-6 text-sm px-1 py-0"
                          />
                          <button onClick={commitRename} className="text-green-600 hover:text-green-700">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={cancelRename} className="text-neutral-400 hover:text-neutral-600">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium truncate">{project.name}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => startRename(project, e)}
                              className="p-0.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(project.id, e)}
                              className="p-0.5 rounded hover:bg-red-50 text-neutral-400 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      <Button className="flex items-center gap-2 h-8" onClick={handleNewDesign}>
        <Plus className="h-4 w-4" />
        New Design
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleSignOut}
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
