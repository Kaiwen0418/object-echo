"use client";

export function NewProjectForm() {
  return (
    <form className="panel form-grid">
      <div>
        <label htmlFor="title">Project title</label>
        <input id="title" name="title" placeholder="Blueberry Device Museum" />
      </div>
      <div>
        <label htmlFor="slug">Slug</label>
        <input id="slug" name="slug" placeholder="blueberry-device-museum" />
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={5} placeholder="Describe the collection and mood." />
      </div>
      <div className="inline-actions">
        <button type="submit" className="primary-button">
          Create Project
        </button>
        <span className="inline-note">TODO: persist this form to Supabase.</span>
      </div>
    </form>
  );
}
