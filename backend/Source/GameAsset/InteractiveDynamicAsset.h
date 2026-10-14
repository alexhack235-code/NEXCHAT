#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "InteractiveDynamicAsset.generated.h"

UENUM(BlueprintType)
enum class EAssetInteractionState : uint8
{
    Idle        UMETA(DisplayName = "Idle"),
    Active      UMETA(DisplayName = "Active"),
    Overloaded  UMETA(DisplayName = "Overloaded"),
    Disabled    UMETA(DisplayName = "Disabled")
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnAssetInteractionStateChanged, EAssetInteractionState, NewState, AActor*, Interactor);

UCLASS(Blueprintable, ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class YOURPROJECT_API AInteractiveDynamicAsset : public AActor
{
    GENERATED_BODY()

public:
    AInteractiveDynamicAsset();

    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;
    virtual void Tick(float DeltaTime) override;

    UFUNCTION(BlueprintCallable, Category = "Interaction")
    void TriggerInteraction(AActor* Initiator);

    UFUNCTION(BlueprintCallable, Category = "Interaction")
    void ApplyKineticImpact(FVector ImpactPoint, FVector ImpulseDirection, float Magnitude);

    UPROPERTY(BlueprintAssignable, Category = "Interaction|Events")
    FOnAssetInteractionStateChanged OnStateChanged;

protected:
    virtual void BeginPlay() override;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    TObjectPtr<UStaticMeshComponent> AssetMesh;

    UPROPERTY(ReplicatedUsing = OnRep_InteractionState, EditAnywhere, BlueprintReadWrite, Category = "State")
    EAssetInteractionState CurrentState;

    UFUNCTION()
    void OnRep_InteractionState();

    UFUNCTION(Server, Reliable, WithValidation)
    void Server_SetInteractionState(EAssetInteractionState NewState, AActor* Initiator);

    UPROPERTY(EditDefaultsOnly, Category = "Visuals")
    FName EnergyScalarParamName;

    UPROPERTY(EditDefaultsOnly, Category = "Visuals")
    float TargetEnergyLevel;

    UPROPERTY(EditDefaultsOnly, Category = "Visuals")
    float InterpolationSpeed;

private:
    UPROPERTY()
    TObjectPtr<UMaterialInstanceDynamic> DynamicMaterialInstance;

    float CurrentEnergyLevel;
    void UpdateMaterialVisuals(float DeltaTime);
};
