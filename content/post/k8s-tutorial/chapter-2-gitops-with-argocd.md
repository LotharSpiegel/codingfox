+++
title = 'Kubernetes Tutorial Chapter 2: GitOps with ArgoCD'
date = 2025-10-19T12:00:00+01:00
draft = false
wip = true
tags = ['K8s', 'Kubernetes', 'Docker', 'ArgoCD', 'GitOps', 'DevOps', 'Tutorial']
series = ['Kubernetes Tutorial']
chapter = 2
+++

# Kubernetes Tutorial Chapter 2: GitOps with ArgoCD

## Introduction

In the previous chapter, we set up a local Kubernetes cluster using Docker Desktop and deployed a simple React application using traditional imperative commands. While this approach works for learning and small-scale deployments, it doesn't scale well for production environments where multiple team members need to collaborate on deployments, track changes, and maintain consistency across environments.

This is where GitOps comes in - a modern approach to managing Kubernetes deployments that leverages Git as the single source of truth for declarative infrastructure and applications.

## What is GitOps?

GitOps is a set of practices that uses Git as the single source of truth for declarative infrastructure and applications. With GitOps, the entire system is described declaratively and versioned in Git, and automated processes ensure the actual system state matches the desired state stored in Git.

### GitOps Principles

GitOps is built around several key principles:

1. **Declarative Configuration**: The entire system is described declaratively, meaning you specify the desired state rather than the steps to achieve it.

2. **Version Controlled, Immutable Storage**: All configuration is stored in Git, providing versioning, audit trails, and the ability to roll back changes.

3. **Automated Delivery**: Changes to the system are automatically applied when changes are made to the Git repository.

4. **Software Agents & Reconciliation**: Software agents continuously monitor the actual system state and reconcile it with the desired state defined in Git.

### Benefits of GitOps

GitOps offers numerous advantages for Kubernetes deployments:

- **Improved Developer Experience**: Developers can use familiar Git workflows to deploy applications.
- **Enhanced Security**: Git's authentication and authorization mechanisms provide security controls.
- **Audit Trail & Compliance**: Git history provides a complete audit trail of all changes.
- **Disaster Recovery**: The entire system state is stored in Git, making disaster recovery simpler.
- **Consistency Across Environments**: The same manifests can be applied to different environments with minimal changes.
- **Simplified Rollbacks**: Rolling back to a previous state is as simple as reverting to a previous Git commit.

## Traditional CI/CD vs GitOps with ArgoCD

### Traditional CI/CD Workflow

In a traditional CI/CD pipeline for Kubernetes:

1. Developer commits code to a Git repository
2. CI pipeline triggers (e.g., Jenkins, GitHub Actions)
3. Tests run and application is built
4. Container image is pushed to a registry
5. CI/CD tool uses kubectl to apply changes to the Kubernetes cluster

This approach has several challenges:
- CI/CD tools need direct access to the Kubernetes cluster
- Security credentials must be managed in the CI/CD system
- No continuous verification that the desired state matches the actual state
- Limited visibility into deployment status
- Difficult to track who changed what and when

### GitOps Workflow with ArgoCD

In a GitOps workflow with ArgoCD:

1. Developer commits code to an application Git repository
2. CI pipeline triggers, builds and tests the application
3. Container image is pushed to a registry
4. CI updates the Kubernetes manifests in a separate configuration Git repository
5. ArgoCD detects changes in the configuration repository
6. ArgoCD automatically applies changes to the Kubernetes cluster

Key differences:
- **Pull vs Push**: ArgoCD pulls changes from Git rather than having a CI/CD tool push changes
- **Separation of Concerns**: CI (development) is separated from CD (operations)
- **Continuous Reconciliation**: ArgoCD continuously ensures the cluster state matches the Git state
- **Improved Security**: No need for external systems to have direct cluster access
- **Better Visibility**: ArgoCD provides a UI to visualize the deployment status

## What is ArgoCD?

ArgoCD is a declarative, GitOps continuous delivery tool for Kubernetes. It automates the deployment of applications to Kubernetes by monitoring changes to application configuration in Git repositories and applying those changes to the target environments.

### Key Features of ArgoCD

- **Automated Deployment**: Automatically applies changes when they are committed to Git
- **Drift Detection**: Detects and corrects when the actual state differs from the desired state
- **Multiple Repository Support**: Can pull configurations from multiple Git repositories
- **Multiple Cluster Support**: Can deploy to multiple Kubernetes clusters
- **Web UI**: Provides a visual interface for deployment status and history
- **SSO Integration**: Supports OIDC, LDAP, and other authentication methods
- **RBAC**: Fine-grained access control
- **Webhook Integration**: Can be triggered by Git webhooks
- **Health Assessment**: Monitors the health of deployed applications
- **Automated or Manual Sync**: Can be configured for automatic or manual synchronization
- **Rollback Capabilities**: Easy rollback to previous versions

## Installing ArgoCD in the Cluster

Now that we understand the concepts, let's install ArgoCD in our local Kubernetes cluster.

### Prerequisites

- A functioning Kubernetes cluster ([from Chapter 1]({{< relref "post/k8s-tutorial/chapter-1-local-k8s-cluster-and-first-deployment.md" >}}))
- kubectl configured to communicate with your cluster
- Git repository for storing Kubernetes manifests

### Installation Steps

1. **Create a Namespace for ArgoCD**

   First, let's create a dedicated namespace for ArgoCD:

   ```bash
   kubectl create namespace argocd
   ```

2. **Deploy ArgoCD Components**

   Apply the ArgoCD installation manifest:

   ```bash
   kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
   ```

   This command deploys all necessary ArgoCD components, including:
   - The API server
   - Repository server
   - Application controller
   - Redis cache
   - Web UI

3. **Verify the Installation**

   Check that all ArgoCD pods are running:

   ```bash
   kubectl get pods -n argocd
   ```

   > **Note**: The `-n argocd` flag specifies the namespace. Without this flag, `kubectl get pods` would only show pods in the default namespace.

   You should see output similar to:

   ```
   NAME                                  READY   STATUS    RESTARTS   AGE
   argocd-application-controller-0       1/1     Running   0          2m
   argocd-dex-server-5db5b7688d-hd8x5    1/1     Running   0          2m
   argocd-redis-759b6bc7f4-r2fkp         1/1     Running   0          2m
   argocd-repo-server-7c9b4b5c8c-qntvz   1/1     Running   0          2m
   argocd-server-85b4dcd876-bvmfn        1/1     Running   0          2m
   ```

4. **Access the ArgoCD UI**

   There are several ways to access the ArgoCD UI:

   **Option 1: Port Forwarding**

   ```bash
   kubectl port-forward svc/argocd-server -n argocd 8080:443
   ```

   Then access the UI at https://localhost:8080

   **Option 2: Create a NodePort Service**

   Create a file named `argocd-nodeport.yaml` with the following content:

   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: argocd-server-nodeport
     namespace: argocd
   spec:
     type: NodePort
     ports:
     - name: https
       port: 443
       targetPort: 8080
       nodePort: 30443
     selector:
       app.kubernetes.io/name: argocd-server
   ```

   Apply the service:

   ```bash
   kubectl apply -f argocd-nodeport.yaml
   ```

   Then access the UI at https://localhost:30443
   
   > **Note**: Your browser will likely show a security warning about an insecure connection because ArgoCD uses a self-signed certificate. You can safely proceed by clicking "Advanced" and then "Proceed to localhost (unsafe)" or similar options in your browser.

5. **Get the Initial Admin Password**

   The initial admin password is automatically generated and stored in a Kubernetes secret. Retrieve it with:

   ```bash
   kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
   ```

   > **Note**: This command uses a pipe with base64 decoding. If you're using Windows, it's recommended to run this in Git Bash or a similar Unix-like shell that supports the base64 command.

   Use this password to log in with the username `admin`.

   > **Note**: For security reasons, you should change this password after the initial login or configure SSO for production environments.

## Setting Up a Git Repository for Kubernetes Manifests

For GitOps to work effectively, we need a Git repository to store our Kubernetes manifests. This repository will be the single source of truth for our application deployments.

### Repository Structure Best Practices

There are several ways to structure your GitOps repository. Here's a recommended approach:

```
├── apps/
│   ├── react-app/
│   │   ├── base/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── kustomization.yaml
│   │   └── overlays/
│   │       ├── dev/
│   │       │   ├── kustomization.yaml
│   │       │   └── patch.yaml
│   │       └── prod/
│   │           ├── kustomization.yaml
│   │           └── patch.yaml
└── README.md
```

This structure uses Kustomize, which is natively supported by both kubectl and ArgoCD, to manage environment-specific configurations.

### Creating the Repository

1. Create a new Git repository (e.g., on GitHub, GitLab, or Bitbucket)
2. Clone the repository to your local machine
3. Create the directory structure as shown above

### Adding Our React App Manifests

Let's move the React app manifests we created in Chapter 1 to our Git repository. Note that these are the same deployment and service files we used in Chapter 1, but instead of applying them directly with kubectl, we'll now manage them through Git and ArgoCD.

1. Create the base directory structure:

   ```bash
   mkdir -p apps/react-app/base
   ```

2. Create the deployment manifest in `apps/react-app/base/deployment.yaml`:

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: react-app
   spec:
     replicas: 2
     selector:
       matchLabels:
         app: react-app
     template:
       metadata:
         labels:
           app: react-app
       spec:
         containers:
         - name: react-app
           image: k8s-demo-react-app:v1
           ports:
           - containerPort: 80
   ```

3. Create the service manifest in `apps/react-app/base/service.yaml`:

   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: react-app-service
   spec:
     type: NodePort
     selector:
       app: react-app
     ports:
     - port: 80
       targetPort: 80
       nodePort: 30080
   ```

4. Create a kustomization file in `apps/react-app/base/kustomization.yaml`:

   ```yaml
   apiVersion: kustomize.config.k8s.io/v1beta1
   kind: Kustomization
   resources:
   - deployment.yaml
   - service.yaml
   ```

   > **What is kustomization.yaml?** This file is the configuration for Kustomize, a Kubernetes native configuration management tool. It defines which resources (like our deployment and service files) should be included when applying this configuration. Kustomize allows you to create base configurations and then customize them for different environments without duplicating the entire configuration. In this simple example, we're just listing the resources to include, but in more complex scenarios, you could add patches, configmap generators, namespace settings, and more.

5. Commit and push these files to your Git repository:

   ```bash
   git add .
   git commit -m "Add React app manifests"
   git push
   ```

## Configuring ArgoCD for Automated Deployments

Now that we have our manifests in Git, let's configure ArgoCD to deploy our application.

### Creating an Application in ArgoCD

There are two ways to create an application in ArgoCD: through the UI or using a YAML manifest.

#### Option 1: Using the ArgoCD UI

1. Access the ArgoCD UI (as described earlier)
2. Log in with the admin credentials
3. Click the "New App" button
4. Fill in the application details:
   - Application Name: `react-app`
   - Project: `default`
   - Sync Policy: `Automatic`
   - Repository URL: Your Git repository URL
   - Path: `apps/react-app/base`
   - Cluster URL: `https://kubernetes.default.svc` (for in-cluster deployment)
   - Namespace: `default`
5. Click "Create"

> **Using GitHub with ArgoCD**:
>
> - For **public GitHub repositories**, you can simply use the HTTPS URL (e.g., `https://github.com/username/repo.git`) without any additional authentication.
>
> - For **private GitHub repositories**, you'll need to set up authentication:
>   1. Create a GitHub Personal Access Token (PAT) with repo permissions
>   2. In ArgoCD, go to Settings > Repositories > Connect Repo
>   3. Select "HTTPS" as the connection method
>   4. Enter your repository URL
>   5. For authentication, select "username/password" and use your GitHub username and the PAT as the password
>   6. Click "Connect"
>
> This creates a repository connection that can be reused for multiple applications. For tutorial purposes, using a public repository is simplest, but in production environments, you'll likely use private repositories with proper authentication.

#### Option 2: Using a YAML Manifest

Create a file named `react-app-application.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: react-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/yourusername/your-gitops-repo.git
    targetRevision: HEAD
    path: apps/react-app/base
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

Apply the manifest:

```bash
kubectl apply -f react-app-application.yaml
```

### Understanding the Application Manifest

Let's break down the key components of the Application manifest:

- **metadata**: Basic information about the ArgoCD Application resource
- **spec.project**: The ArgoCD project this application belongs to
- **spec.source**: Where to find the application manifests
  - **repoURL**: The Git repository URL
  - **targetRevision**: The Git revision (branch, tag, or commit)
  - **path**: The path within the repository
- **spec.destination**: Where to deploy the application
  - **server**: The Kubernetes cluster API URL
  - **namespace**: The target namespace
- **spec.syncPolicy**: How ArgoCD should sync the application
  - **automated.prune**: Automatically delete resources that are no longer defined in Git
  - **automated.selfHeal**: Automatically sync when the cluster state deviates from the desired state

### Monitoring the Deployment

Once the application is created, ArgoCD will start syncing it with the cluster. You can monitor the progress in the ArgoCD UI or using the ArgoCD CLI:

```bash
# Install ArgoCD CLI (if not already installed)
# For Windows:
# Download from https://github.com/argoproj/argo-cd/releases

# Log in to ArgoCD
argocd login localhost:8080

# Check application status
argocd app get react-app
```

### Verifying the Deployment

After the sync is complete, verify that the application is running:

```bash
kubectl get pods
kubectl get svc
```

Access the application at http://localhost:30080

## Making Changes with GitOps

Now let's see how GitOps works in practice by making a change to our application.

### Updating the Application

Let's update our deployment to use 3 replicas instead of 2:

1. Modify `apps/react-app/base/deployment.yaml` in your Git repository:

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: react-app
   spec:
     replicas: 3  # Changed from 2 to 3
     selector:
       matchLabels:
         app: react-app
     template:
       metadata:
         labels:
           app: react-app
       spec:
         containers:
         - name: react-app
           image: k8s-demo-react-app:v1
           ports:
           - containerPort: 80
   ```

2. Commit and push the change:

   ```bash
   git add apps/react-app/base/deployment.yaml
   git commit -m "Increase replicas to 3"
   git push
   ```

3. Watch ArgoCD automatically detect and apply the change:

   ```bash
   kubectl get pods
   ```

   You should see a third pod being created.

### Rolling Back Changes

If you need to roll back a change, simply revert the commit in Git:

```bash
git revert HEAD
git push
```

ArgoCD will detect the change and revert the deployment back to 2 replicas.

## Advanced ArgoCD Features

ArgoCD offers many advanced features that can enhance your GitOps workflow:

### Health Status Monitoring

ArgoCD continuously monitors the health of your applications and displays their status in the UI. It can detect issues such as:

- Pods not running
- Deployments not progressing
- Services not available

### RBAC and Multi-Tenancy

ArgoCD supports Role-Based Access Control (RBAC) to restrict access to applications and projects. This is useful in multi-tenant environments where different teams manage different applications.

### Webhook Integration

You can configure webhooks in your Git repository to notify ArgoCD of changes, reducing the sync latency.

### Notifications

ArgoCD can send notifications about application events (sync, health status changes) to various channels like Slack, email, or custom webhooks.

## Troubleshooting

Here are some common issues you might encounter with ArgoCD and how to resolve them:

### Application Not Syncing

If your application is not syncing:

1. Check the application status in the ArgoCD UI
2. Look for error messages in the application events
3. Verify that ArgoCD can access your Git repository
4. Check that the path to your manifests is correct

### Image Pull Errors

If pods are failing with image pull errors:

1. Verify that the image exists in the registry
2. Check that the image name and tag are correct
3. Configure image pull secrets if using a private registry

### Connection Issues

If ArgoCD cannot connect to your Git repository:

1. Verify the repository URL
2. Check that the repository is accessible
3. Configure SSH keys or access tokens if needed

## Next Chapter Preview

Chapter 3 will cover:
- Implementing a complete microservices application
- Service mesh integration
- Monitoring and observability
- Scaling strategies

## References

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [GitOps Principles](https://www.gitops.tech/)
- [Kustomize Documentation](https://kustomize.io/)
- [ArgoCD Best Practices](https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/)