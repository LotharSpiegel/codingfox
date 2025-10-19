+++
title = 'Kubernetes Tutorial: Troubleshooting Guide'
date = 2025-10-19T12:00:00+01:00
draft = false
wip = true
tags = ['K8s', 'Kubernetes', 'Docker', 'Windows', 'Tutorial', 'DevOps', 'Troubleshooting']
series = ['Kubernetes Tutorial']
+++

# Kubernetes Tutorial: Troubleshooting Guide

This guide provides solutions to common issues you might encounter when setting up and working with a local Kubernetes cluster on Docker Desktop.

## Docker Desktop Startup Issues

### Problem: Docker Desktop fails to start

**Possible causes and solutions:**

1. **Virtualization not enabled in BIOS**
   - Restart your computer and enter BIOS settings (usually by pressing F2, F10, or Del during startup)
   - Look for Virtualization Technology, VT-x, AMD-V, or similar options
   - Enable these settings, save changes, and restart

2. **Hyper-V or WSL 2 configuration issues**
   - Ensure Hyper-V is properly installed (for Hyper-V backend)
   - For WSL 2 backend, verify WSL 2 is installed and updated
   - Run PowerShell as Administrator and execute:
     ```powershell
     # For Hyper-V
     Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
     
     # For WSL 2
     wsl --update
     ```

3. **Windows features missing**
   - Open "Turn Windows features on or off" from Control Panel
   - Ensure the following are enabled:
     - Hyper-V (if using Hyper-V backend)
     - Virtual Machine Platform
     - Windows Subsystem for Linux (if using WSL 2)
   - Restart your computer after enabling these features

### Problem: Docker Desktop is extremely slow

**Possible solutions:**

1. Increase resource allocation in Docker Desktop settings:
   - Open Docker Desktop > Settings > Resources
   - Increase CPU, Memory, and Swap allocations
   - Recommended minimum: 2 CPUs, 4GB RAM

2. Check for disk space issues:
   - Ensure you have at least 10GB free space
   - Clean up unused Docker images and volumes:
     ```powershell
     docker system prune -a
     ```

## Kubernetes Initialization Problems

### Problem: Kubernetes fails to start or gets stuck

**Possible solutions:**

1. **Increase Docker Desktop resources**
   - Open Docker Desktop > Settings > Resources
   - Increase memory allocation to at least 4GB
   - Increase CPU allocation to at least 2 CPUs

2. **Reset Kubernetes cluster**
   - Open Docker Desktop > Settings > Kubernetes
   - Click "Reset Kubernetes Cluster"
   - Wait for the process to complete and try enabling Kubernetes again

3. **Check for network conflicts**
   - Ensure no other services are using ports required by Kubernetes (6443, 10250-10252)
   - Temporarily disable VPNs or other network tools that might interfere

4. **Review Docker Desktop logs**
   - Open Docker Desktop > Troubleshoot > Get support
   - Click "Diagnose & Feedback" to generate logs
   - Review logs for specific error messages

### Problem: "No connection could be made because the target machine actively refused it"

This typically indicates a port conflict or networking issue:

1. Check if another service is using Kubernetes ports:
   ```powershell
   netstat -ano | findstr 6443
   netstat -ano | findstr 10250
   ```

2. Temporarily disable firewall to test if it's blocking connections:
   ```powershell
   # Note: Re-enable after testing
   netsh advfirewall set allprofiles state off
   ```

3. Reset Docker Desktop networking:
   - Open Docker Desktop > Troubleshoot
   - Click "Clean / Purge data"
   - Select "Reset network" and apply

## kubectl Command Failures

### Problem: "kubectl: command not found"

**Solutions:**

1. Verify Docker Desktop installation:
   - Reinstall Docker Desktop if necessary
   - Ensure the "Add to PATH" option was selected during installation

2. Manually add kubectl to PATH:
   - Locate kubectl.exe (typically in `C:\Program Files\Docker\Docker\resources\bin`)
   - Add this directory to your system PATH

3. Install kubectl separately:
   ```powershell
   # Using Chocolatey
   choco install kubernetes-cli
   
   # Or download directly
   curl -LO "https://dl.k8s.io/release/v1.26.0/bin/windows/amd64/kubectl.exe"
   # Move to a directory in your PATH
   ```

### Problem: "The connection to the server localhost:8080 was refused"

**Solutions:**

1. Ensure Docker Desktop is running and Kubernetes is enabled

2. Check kubectl configuration:
   ```powershell
   kubectl config view
   ```

3. Set the correct context:
   ```powershell
   kubectl config use-context docker-desktop
   ```

4. Manually configure kubectl:
   ```powershell
   kubectl config set-cluster docker-desktop --server=https://localhost:6443
   kubectl config set-context docker-desktop --cluster=docker-desktop
   kubectl config use-context docker-desktop
   ```

## Deployment Issues

### Problem: Pods stuck in "Pending" state

**Possible causes and solutions:**

1. **Insufficient resources**
   - Increase Docker Desktop resource allocation
   - Reduce resource requests in your deployment YAML

2. **PersistentVolumeClaim issues**
   - Check if PVCs are bound:
     ```powershell
     kubectl get pvc
     ```
   - Ensure storage class exists:
     ```powershell
     kubectl get storageclass
     ```

3. **Node taints or affinity issues**
   - Check node conditions:
     ```powershell
     kubectl describe node docker-desktop
     ```

### Problem: "ImagePullBackOff" or "ErrImagePull" errors

**Solutions:**

1. For local images, ensure they're properly built and tagged:
   ```powershell
   docker images
   ```

2. For private repositories, configure image pull secrets:
   ```powershell
   kubectl create secret docker-registry regcred --docker-server=<your-registry-server> --docker-username=<username> --docker-password=<password>
   ```
   Then reference this secret in your deployment YAML.

3. Check image name and tag for typos in your deployment YAML

## Networking Issues

### Problem: Cannot access services via NodePort

**Solutions:**

1. Verify the service is running:
   ```powershell
   kubectl get services
   ```

2. Check if pods are running and ready:
   ```powershell
   kubectl get pods
   ```

3. Ensure the NodePort is accessible:
   ```powershell
   # Test connection
   curl http://localhost:<nodePort>
   ```

4. Check for firewall rules blocking the port

### Problem: DNS resolution issues between pods

**Solutions:**

1. Verify CoreDNS is running:
   ```powershell
   kubectl get pods -n kube-system | findstr coredns
   ```

2. Check DNS configuration:
   ```powershell
   kubectl exec -it <pod-name> -- cat /etc/resolv.conf
   ```

3. Test DNS resolution from within a pod:
   ```powershell
   kubectl exec -it <pod-name> -- nslookup kubernetes.default
   ```

## Additional Resources

- [Docker Desktop Troubleshooting Guide](https://docs.docker.com/desktop/troubleshoot/overview/)
- [Kubernetes Debugging Guide](https://kubernetes.io/docs/tasks/debug/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)